package handlers

import (
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

	token, err := auth.GenerateToken()
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to generate token")
		return
	}

	expiresAt := time.Now().UTC().Add(auth.SessionDuration)
	if _, err := h.Queries.CreateSession(ctx, db.CreateSessionParams{
		UserID:    userID,
		Token:     token,
		ExpiresAt: expiresAt,
	}); err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create session")
		return
	}

	server.WriteJSON(w, http.StatusCreated, authResponse{
		User: userResponse{
			ID:    userID,
			Email: req.Email,
			Name:  req.Name,
		},
		Token: token,
	})
}
