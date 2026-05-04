package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type ContactsHandler struct {
	Queries *db.Queries
}

type contactRequest struct {
	Name                     string `json:"name"`
	Role                     string `json:"role"`
	RelationshipNotes        string `json:"relationship_notes"`
	CommunicationPreferences string `json:"communication_preferences"`
	WatchOutFor              string `json:"watch_out_for"`
	Favorite                 bool   `json:"favorite"`
}

type contactResponse struct {
	ID                       int32     `json:"id"`
	RolebookID               int32     `json:"rolebook_id"`
	Name                     string    `json:"name"`
	Role                     string    `json:"role"`
	RelationshipNotes        string    `json:"relationship_notes"`
	CommunicationPreferences string    `json:"communication_preferences"`
	WatchOutFor              string    `json:"watch_out_for"`
	Favorite                 bool      `json:"favorite"`
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
}

func contactToResponse(c db.Contact) contactResponse {
	return contactResponse{
		ID:                       c.ID,
		RolebookID:               c.RolebookID,
		Name:                     c.Name,
		Role:                     server.FromNullable(c.Role),
		RelationshipNotes:        server.FromNullable(c.RelationshipNotes),
		CommunicationPreferences: server.FromNullable(c.CommunicationPreferences),
		WatchOutFor:              server.FromNullable(c.WatchOutFor),
		Favorite:                 c.Favorite,
		CreatedAt:                c.CreatedAt,
		UpdatedAt:                c.UpdatedAt,
	}
}

func (h *ContactsHandler) List(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	rows, err := h.Queries.ListContactsByRolebook(r.Context(), rolebookID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to list contacts")
		return
	}
	out := make([]contactResponse, 0, len(rows))
	for _, c := range rows {
		out = append(out, contactToResponse(c))
	}
	server.WriteJSON(w, http.StatusOK, out)
}

func (h *ContactsHandler) Create(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	var req contactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_name", "name is required")
		return
	}
	res, err := h.Queries.CreateContact(r.Context(), db.CreateContactParams{
		RolebookID:               rolebookID,
		Name:                     req.Name,
		Role:                     server.Nullable(req.Role),
		RelationshipNotes:        server.Nullable(req.RelationshipNotes),
		CommunicationPreferences: server.Nullable(req.CommunicationPreferences),
		WatchOutFor:              server.Nullable(req.WatchOutFor),
		Favorite:                 req.Favorite,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create contact")
		return
	}
	id, _ := res.LastInsertId()
	contact, err := h.Queries.GetContactByIDAndRolebook(r.Context(), db.GetContactByIDAndRolebookParams{
		ID:         int32(id),
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "contact created but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusCreated, contactToResponse(contact))
}

func (h *ContactsHandler) Update(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	var req contactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_name", "name is required")
		return
	}
	res, err := h.Queries.UpdateContact(r.Context(), db.UpdateContactParams{
		ID:                       id,
		RolebookID:               rolebookID,
		Name:                     req.Name,
		Role:                     server.Nullable(req.Role),
		RelationshipNotes:        server.Nullable(req.RelationshipNotes),
		CommunicationPreferences: server.Nullable(req.CommunicationPreferences),
		WatchOutFor:              server.Nullable(req.WatchOutFor),
		Favorite:                 req.Favorite,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update contact")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "contact not found")
		return
	}
	contact, err := h.Queries.GetContactByIDAndRolebook(r.Context(), db.GetContactByIDAndRolebookParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "contact updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, contactToResponse(contact))
}

type favoriteRequest struct {
	Favorite bool `json:"favorite"`
}

// SetFavorite is a small dedicated endpoint for one-click star toggles
// that doesn't require sending the contact's full body.
func (h *ContactsHandler) SetFavorite(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	var req favoriteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	res, err := h.Queries.SetContactFavorite(r.Context(), db.SetContactFavoriteParams{
		Favorite:   req.Favorite,
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update favorite")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "contact not found")
		return
	}
	contact, err := h.Queries.GetContactByIDAndRolebook(r.Context(), db.GetContactByIDAndRolebookParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "contact updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, contactToResponse(contact))
}

func (h *ContactsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	res, err := h.Queries.DeleteContact(r.Context(), db.DeleteContactParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to delete contact")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "contact not found")
		return
	}
	server.WriteJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
