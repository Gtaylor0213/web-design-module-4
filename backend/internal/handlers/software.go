package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type SoftwareHandler struct {
	Queries *db.Queries
}

type softwareRequest struct {
	Name                string `json:"name"`
	Purpose             string `json:"purpose"`
	CredentialsLocation string `json:"credentials_location"`
	Notes               string `json:"notes"`
}

type softwareResponse struct {
	ID                  int32     `json:"id"`
	RolebookID          int32     `json:"rolebook_id"`
	Name                string    `json:"name"`
	Purpose             string    `json:"purpose"`
	CredentialsLocation string    `json:"credentials_location"`
	Notes               string    `json:"notes"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func softwareToResponse(s db.Software) softwareResponse {
	return softwareResponse{
		ID:                  s.ID,
		RolebookID:          s.RolebookID,
		Name:                s.Name,
		Purpose:             server.FromNullable(s.Purpose),
		CredentialsLocation: server.FromNullable(s.CredentialsLocation),
		Notes:               server.FromNullable(s.Notes),
		CreatedAt:           s.CreatedAt,
		UpdatedAt:           s.UpdatedAt,
	}
}

func (h *SoftwareHandler) List(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	rows, err := h.Queries.ListSoftwareByRolebook(r.Context(), rolebookID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to list software")
		return
	}
	out := make([]softwareResponse, 0, len(rows))
	for _, s := range rows {
		out = append(out, softwareToResponse(s))
	}
	server.WriteJSON(w, http.StatusOK, out)
}

func (h *SoftwareHandler) Create(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	var req softwareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_name", "name is required")
		return
	}
	res, err := h.Queries.CreateSoftware(r.Context(), db.CreateSoftwareParams{
		RolebookID:          rolebookID,
		Name:                req.Name,
		Purpose:             server.Nullable(req.Purpose),
		CredentialsLocation: server.Nullable(req.CredentialsLocation),
		Notes:               server.Nullable(req.Notes),
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create software")
		return
	}
	id, _ := res.LastInsertId()
	software, err := h.Queries.GetSoftwareByIDAndRolebook(r.Context(), db.GetSoftwareByIDAndRolebookParams{
		ID:         int32(id),
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "software created but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusCreated, softwareToResponse(software))
}

func (h *SoftwareHandler) Update(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	var req softwareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_name", "name is required")
		return
	}
	res, err := h.Queries.UpdateSoftware(r.Context(), db.UpdateSoftwareParams{
		ID:                  id,
		RolebookID:          rolebookID,
		Name:                req.Name,
		Purpose:             server.Nullable(req.Purpose),
		CredentialsLocation: server.Nullable(req.CredentialsLocation),
		Notes:               server.Nullable(req.Notes),
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update software")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "software not found")
		return
	}
	software, err := h.Queries.GetSoftwareByIDAndRolebook(r.Context(), db.GetSoftwareByIDAndRolebookParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "software updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, softwareToResponse(software))
}

func (h *SoftwareHandler) Delete(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	res, err := h.Queries.DeleteSoftware(r.Context(), db.DeleteSoftwareParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to delete software")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "software not found")
		return
	}
	server.WriteJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
