package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/auth"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

const minPasswordLen = 8

type AuthHandler struct {
	Queries *db.Queries
}

type signupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID    int32  `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type authResponse struct {
	User  userResponse `json:"user"`
	Token string       `json:"token"`
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)

	if !strings.Contains(req.Email, "@") || len(req.Email) < 3 {
		server.WriteError(w, http.StatusBadRequest, "invalid_email", "email is required and must be valid")
		return
	}
	if len(req.Password) < minPasswordLen {
		server.WriteError(w, http.StatusBadRequest, "weak_password", "password must be at least 8 characters")
		return
	}
	if req.Name == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_name", "name is required")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to hash password")
		return
	}

	ctx := r.Context()
	res, err := h.Queries.CreateUser(ctx, db.CreateUserParams{
		Email:        req.Email,
		PasswordHash: hash,
		Name:         req.Name,
	})
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			server.WriteError(w, http.StatusConflict, "email_taken", "an account with that email already exists")
			return
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create user")
		return
	}

	userID64, err := res.LastInsertId()
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to retrieve user id")
		return
	}
	userID := int32(userID64)

	token, expiresAt, err := h.issueSession(r, userID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create session")
		return
	}
	_ = expiresAt

	server.WriteJSON(w, http.StatusCreated, authResponse{
		User: userResponse{
			ID:    userID,
			Email: req.Email,
			Name:  req.Name,
		},
		Token: token,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		server.WriteError(w, http.StatusUnauthorized, "invalid_credentials", "incorrect email or password")
		return
	}

	ctx := r.Context()
	user, err := h.Queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		// Same response whether the email is unknown or the password is wrong:
		// no signal to attackers about which emails are registered.
		if errors.Is(err, sql.ErrNoRows) {
			server.WriteError(w, http.StatusUnauthorized, "invalid_credentials", "incorrect email or password")
			return
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to look up user")
		return
	}

	if err := auth.CheckPassword(user.PasswordHash, req.Password); err != nil {
		server.WriteError(w, http.StatusUnauthorized, "invalid_credentials", "incorrect email or password")
		return
	}

	token, _, err := h.issueSession(r, user.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create session")
		return
	}

	server.WriteJSON(w, http.StatusOK, authResponse{
		User: userResponse{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
		Token: token,
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFrom(r.Context())
	if !ok {
		server.WriteError(w, http.StatusInternalServerError, "internal", "user not in context")
		return
	}
	server.WriteJSON(w, http.StatusOK, userResponse{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
	})
}

// Logout is intentionally permissive: a missing or unknown token still
// returns 200 (the caller is, in effect, logged out). Database errors
// still surface as 500.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token, ok := auth.BearerToken(r)
	if ok {
		if err := h.Queries.DeleteSessionByToken(r.Context(), token); err != nil {
			server.WriteError(w, http.StatusInternalServerError, "internal", "failed to log out")
			return
		}
	}
	server.WriteJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
}

// issueSession generates a fresh token and writes a sessions row for the
// given user, returning the token and its expiry.
func (h *AuthHandler) issueSession(r *http.Request, userID int32) (string, time.Time, error) {
	token, err := auth.GenerateToken()
	if err != nil {
		return "", time.Time{}, err
	}
	expiresAt := time.Now().UTC().Add(auth.SessionDuration)
	if _, err := h.Queries.CreateSession(r.Context(), db.CreateSessionParams{
		UserID:    userID,
		Token:     token,
		ExpiresAt: expiresAt,
	}); err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}
