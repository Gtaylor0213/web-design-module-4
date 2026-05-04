package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/auth"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

// requireRolebookID resolves the authenticated user's rolebook id. If the
// user has not yet created a rolebook, responds 404 not_setup and returns
// false; the caller should return immediately. Used by every section
// handler since section entries are scoped to a rolebook.
func requireRolebookID(w http.ResponseWriter, r *http.Request, queries *db.Queries) (int32, bool) {
	user, ok := auth.UserFrom(r.Context())
	if !ok {
		server.WriteError(w, http.StatusInternalServerError, "internal", "user not in context")
		return 0, false
	}
	rolebook, err := queries.GetRolebookByOwner(r.Context(), user.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			server.WriteError(w, http.StatusNotFound, "not_setup", "create a rolebook first via POST /api/rolebook")
			return 0, false
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch rolebook")
		return 0, false
	}
	return rolebook.ID, true
}

// parseIDPath extracts the {id} path value (Go 1.22+ ServeMux) and parses
// it as an int32. Returns 0 and false on error after writing a 400 response.
func parseIDPath(w http.ResponseWriter, r *http.Request) (int32, bool) {
	raw := r.PathValue("id")
	n, err := strconv.ParseInt(raw, 10, 32)
	if err != nil || n <= 0 {
		server.WriteError(w, http.StatusBadRequest, "invalid_id", "id path parameter must be a positive integer")
		return 0, false
	}
	return int32(n), true
}

// parseSubtaskIDPath extracts the {subtask_id} path value for nested
// /api/projects/{id}/subtasks/{subtask_id} routes.
func parseSubtaskIDPath(w http.ResponseWriter, r *http.Request) (int32, bool) {
	raw := r.PathValue("subtask_id")
	n, err := strconv.ParseInt(raw, 10, 32)
	if err != nil || n <= 0 {
		server.WriteError(w, http.StatusBadRequest, "invalid_id", "subtask_id path parameter must be a positive integer")
		return 0, false
	}
	return int32(n), true
}
