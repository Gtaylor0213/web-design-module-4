package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/auth"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type RolebookHandler struct {
	Queries *db.Queries
}

type rolebookRequest struct {
	RoleTitle string `json:"role_title"`
}

type transferRequest struct {
	NewOwnerEmail string `json:"new_owner_email"`
}

func (h *RolebookHandler) Get(w http.ResponseWriter, r *http.Request) {
	user, _ := auth.UserFrom(r.Context())

	rolebook, err := h.Queries.GetRolebookByOwner(r.Context(), user.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			server.WriteError(w, http.StatusNotFound, "not_setup", "rolebook not yet created — call POST /api/rolebook to set it up")
			return
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch rolebook")
		return
	}
	server.WriteJSON(w, http.StatusOK, rolebook)
}

func (h *RolebookHandler) Create(w http.ResponseWriter, r *http.Request) {
	user, _ := auth.UserFrom(r.Context())

	req, ok := decodeRolebookRequest(w, r)
	if !ok {
		return
	}

	if _, err := h.Queries.GetRolebookByOwner(r.Context(), user.ID); err == nil {
		server.WriteError(w, http.StatusConflict, "rolebook_exists", "you already have a rolebook")
		return
	} else if !errors.Is(err, sql.ErrNoRows) {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to check existing rolebook")
		return
	}

	if _, err := h.Queries.CreateRolebook(r.Context(), db.CreateRolebookParams{
		OwnerID:   user.ID,
		RoleTitle: req.RoleTitle,
	}); err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create rolebook")
		return
	}

	rolebook, err := h.Queries.GetRolebookByOwner(r.Context(), user.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "rolebook created but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusCreated, rolebook)
}

func (h *RolebookHandler) Update(w http.ResponseWriter, r *http.Request) {
	user, _ := auth.UserFrom(r.Context())

	req, ok := decodeRolebookRequest(w, r)
	if !ok {
		return
	}

	res, err := h.Queries.UpdateRolebookByOwner(r.Context(), db.UpdateRolebookByOwnerParams{
		RoleTitle: req.RoleTitle,
		OwnerID:   user.ID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update rolebook")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_setup", "no rolebook to update — call POST /api/rolebook first")
		return
	}

	rolebook, err := h.Queries.GetRolebookByOwner(r.Context(), user.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "rolebook updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, rolebook)
}

// Transfer moves ownership of the authenticated user's rolebook to another
// registered user, identified by email. After a successful transfer, the
// original owner's rolebooks.owner_id row no longer references them, so
// GET /api/rolebook will return 404 for the original owner. Their session
// remains valid (they're still a registered user) but the frontend is
// expected to log them out per the architecture flow.
//
// Edge cases:
//   - target email not registered → 404 no_account (matches architecture.md)
//   - target user already owns a rolebook → 409 target_has_rolebook
//     (one-rolebook-per-user is enforced at the application layer)
//   - target email is the current user's own email → 400 invalid_target
//   - the current user has no rolebook to transfer → 404 not_setup
func (h *RolebookHandler) Transfer(w http.ResponseWriter, r *http.Request) {
	user, _ := auth.UserFrom(r.Context())

	var req transferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	targetEmail := strings.TrimSpace(strings.ToLower(req.NewOwnerEmail))
	if !strings.Contains(targetEmail, "@") || len(targetEmail) < 3 {
		server.WriteError(w, http.StatusBadRequest, "invalid_email", "new_owner_email is required and must be valid")
		return
	}
	if targetEmail == strings.ToLower(user.Email) {
		server.WriteError(w, http.StatusBadRequest, "invalid_target", "you cannot transfer your rolebook to yourself")
		return
	}

	// Check the caller has something to transfer first — gives a clearer
	// error than complaining about the target when the source has no rolebook.
	if _, err := h.Queries.GetRolebookByOwner(r.Context(), user.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			server.WriteError(w, http.StatusNotFound, "not_setup", "you don't have a rolebook to transfer")
			return
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to check your rolebook")
		return
	}

	target, err := h.Queries.GetUserByEmail(r.Context(), targetEmail)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			server.WriteError(w, http.StatusNotFound, "no_account", "That email isn't registered with Rolebook — ask them to sign up first.")
			return
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to look up target user")
		return
	}

	if _, err := h.Queries.GetRolebookByOwner(r.Context(), target.ID); err == nil {
		server.WriteError(w, http.StatusConflict, "target_has_rolebook", "the target user already owns a rolebook")
		return
	} else if !errors.Is(err, sql.ErrNoRows) {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to check target rolebook")
		return
	}

	res, err := h.Queries.TransferRolebookOwnership(r.Context(), db.TransferRolebookOwnershipParams{
		NewOwnerID: target.ID,
		OldOwnerID: user.ID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to transfer rolebook")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		// Race: rolebook existed at the check above but was gone by the time
		// we tried to update. Fall back to not_setup.
		server.WriteError(w, http.StatusNotFound, "not_setup", "you don't have a rolebook to transfer")
		return
	}

	server.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": fmt.Sprintf("Rolebook transferred to %s. You no longer have access.", targetEmail),
	})
}

func decodeRolebookRequest(w http.ResponseWriter, r *http.Request) (rolebookRequest, bool) {
	var req rolebookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return req, false
	}
	req.RoleTitle = strings.TrimSpace(req.RoleTitle)
	if req.RoleTitle == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_role_title", "role_title is required")
		return req, false
	}
	return req, true
}
