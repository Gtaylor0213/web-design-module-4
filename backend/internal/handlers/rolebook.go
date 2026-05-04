package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
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
