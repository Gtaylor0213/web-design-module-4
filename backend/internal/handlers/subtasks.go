package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type SubtasksHandler struct {
	Queries *db.Queries
}

type subtaskRequest struct {
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

type subtaskResponse struct {
	ID        int32     `json:"id"`
	ProjectID int32     `json:"project_id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func subtaskToResponse(s db.ProjectSubtask) subtaskResponse {
	return subtaskResponse{
		ID:        s.ID,
		ProjectID: s.ProjectID,
		Title:     s.Title,
		Completed: s.Completed,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}
}

// requireProjectInRolebook resolves the rolebook for the authenticated
// user, parses {id} from the URL, and verifies the project belongs to
// that rolebook. Returns the project id (which is also the subtask's
// project_id) on success; on failure responds with the appropriate 4xx
// and returns false.
func (h *SubtasksHandler) requireProjectInRolebook(w http.ResponseWriter, r *http.Request) (int32, bool) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return 0, false
	}
	projectID, ok := parseIDPath(w, r)
	if !ok {
		return 0, false
	}
	_, err := h.Queries.GetProjectByIDAndRolebook(r.Context(), db.GetProjectByIDAndRolebookParams{
		ID:         projectID,
		RolebookID: rolebookID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			server.WriteError(w, http.StatusNotFound, "not_found", "project not found")
			return 0, false
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch project")
		return 0, false
	}
	return projectID, true
}

func (h *SubtasksHandler) Create(w http.ResponseWriter, r *http.Request) {
	projectID, ok := h.requireProjectInRolebook(w, r)
	if !ok {
		return
	}
	var req subtaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_title", "title is required")
		return
	}
	res, err := h.Queries.CreateSubtask(r.Context(), db.CreateSubtaskParams{
		ProjectID: projectID,
		Title:     req.Title,
		Completed: req.Completed,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create subtask")
		return
	}
	id, _ := res.LastInsertId()
	subtask, err := h.Queries.GetSubtaskByIDAndProject(r.Context(), db.GetSubtaskByIDAndProjectParams{
		ID:        int32(id),
		ProjectID: projectID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "subtask created but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusCreated, subtaskToResponse(subtask))
}

func (h *SubtasksHandler) Update(w http.ResponseWriter, r *http.Request) {
	projectID, ok := h.requireProjectInRolebook(w, r)
	if !ok {
		return
	}
	subtaskID, ok := parseSubtaskIDPath(w, r)
	if !ok {
		return
	}
	var req subtaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_title", "title is required")
		return
	}
	res, err := h.Queries.UpdateSubtask(r.Context(), db.UpdateSubtaskParams{
		ID:        subtaskID,
		ProjectID: projectID,
		Title:     req.Title,
		Completed: req.Completed,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update subtask")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "subtask not found")
		return
	}
	subtask, err := h.Queries.GetSubtaskByIDAndProject(r.Context(), db.GetSubtaskByIDAndProjectParams{
		ID:        subtaskID,
		ProjectID: projectID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "subtask updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, subtaskToResponse(subtask))
}

func (h *SubtasksHandler) Delete(w http.ResponseWriter, r *http.Request) {
	projectID, ok := h.requireProjectInRolebook(w, r)
	if !ok {
		return
	}
	subtaskID, ok := parseSubtaskIDPath(w, r)
	if !ok {
		return
	}
	res, err := h.Queries.DeleteSubtask(r.Context(), db.DeleteSubtaskParams{
		ID:        subtaskID,
		ProjectID: projectID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to delete subtask")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "subtask not found")
		return
	}
	server.WriteJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
