package auth

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type contextKey int

const userKey contextKey = iota

// RequireAuth returns middleware that validates the Bearer token in the
// Authorization header against the sessions table. On success, the
// authenticated user is attached to the request context (retrieve via
// UserFrom). On any failure, responds 401 and aborts.
func RequireAuth(queries *db.Queries) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			token, ok := BearerToken(r)
			if !ok {
				server.WriteError(w, http.StatusUnauthorized, "unauthorized", "missing or malformed Authorization header")
				return
			}

			session, err := queries.GetSessionByToken(r.Context(), token)
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					server.WriteError(w, http.StatusUnauthorized, "unauthorized", "invalid or expired token")
					return
				}
				server.WriteError(w, http.StatusInternalServerError, "internal", "failed to look up session")
				return
			}

			user, err := queries.GetUserByID(r.Context(), session.UserID)
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					server.WriteError(w, http.StatusUnauthorized, "unauthorized", "user no longer exists")
					return
				}
				server.WriteError(w, http.StatusInternalServerError, "internal", "failed to look up user")
				return
			}

			ctx := context.WithValue(r.Context(), userKey, user)
			next(w, r.WithContext(ctx))
		}
	}
}

func UserFrom(ctx context.Context) (db.User, bool) {
	u, ok := ctx.Value(userKey).(db.User)
	return u, ok
}

// BearerToken extracts the token from an "Authorization: Bearer <token>"
// header. Returns false if the header is missing or malformed.
func BearerToken(r *http.Request) (string, bool) {
	h := r.Header.Get("Authorization")
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return "", false
	}
	token := strings.TrimSpace(h[len(prefix):])
	if token == "" {
		return "", false
	}
	return token, true
}
