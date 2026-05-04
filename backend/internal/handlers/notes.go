package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type NotesHandler struct {
	Queries *db.Queries
}

type noteRequest struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

type noteResponse struct {
	ID         int32     `json:"id"`
	RolebookID int32     `json:"rolebook_id"`
	Title      string    `json:"title"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func noteToResponse(n db.Note) noteResponse {
	return noteResponse{
		ID:         n.ID,
		RolebookID: n.RolebookID,
		Title:      n.Title,
		Body:       n.Body,
		CreatedAt:  n.CreatedAt,
		UpdatedAt:  n.UpdatedAt,
	}
}

func (h *NotesHandler) List(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	rows, err := h.Queries.ListNotesByRolebook(r.Context(), rolebookID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to list notes")
		return
	}
	out := make([]noteResponse, 0, len(rows))
	for _, n := range rows {
		out = append(out, noteToResponse(n))
	}
	server.WriteJSON(w, http.StatusOK, out)
}

func (h *NotesHandler) Create(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	var req noteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_title", "title is required")
		return
	}
	if req.Body == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_body", "body is required")
		return
	}
	res, err := h.Queries.CreateNote(r.Context(), db.CreateNoteParams{
		RolebookID: rolebookID,
		Title:      req.Title,
		Body:       req.Body,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create note")
		return
	}
	id, _ := res.LastInsertId()
	note, err := h.Queries.GetNoteByIDAndRolebook(r.Context(), db.GetNoteByIDAndRolebookParams{
		ID:         int32(id),
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "note created but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusCreated, noteToResponse(note))
}

func (h *NotesHandler) Update(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	var req noteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_title", "title is required")
		return
	}
	if req.Body == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_body", "body is required")
		return
	}
	res, err := h.Queries.UpdateNote(r.Context(), db.UpdateNoteParams{
		ID:         id,
		RolebookID: rolebookID,
		Title:      req.Title,
		Body:       req.Body,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update note")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "note not found")
		return
	}
	note, err := h.Queries.GetNoteByIDAndRolebook(r.Context(), db.GetNoteByIDAndRolebookParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "note updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, noteToResponse(note))
}

func (h *NotesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	res, err := h.Queries.DeleteNote(r.Context(), db.DeleteNoteParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to delete note")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "note not found")
		return
	}
	server.WriteJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
