package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type ProjectsHandler struct {
	Queries *db.Queries
}

type projectRequest struct {
	Title    string `json:"title"`
	Status   string `json:"status"`
	Deadline string `json:"deadline"` // YYYY-MM-DD or ""
	Notes    string `json:"notes"`
}

type projectResponse struct {
	ID         int32     `json:"id"`
	RolebookID int32     `json:"rolebook_id"`
	Title      string    `json:"title"`
	Status     string    `json:"status"`
	Deadline   string    `json:"deadline"` // YYYY-MM-DD or ""
	Notes      string    `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func projectToResponse(p db.Project) projectResponse {
	deadline := ""
	if p.Deadline.Valid {
		deadline = p.Deadline.Time.Format("2006-01-02")
	}
	return projectResponse{
		ID:         p.ID,
		RolebookID: p.RolebookID,
		Title:      p.Title,
		Status:     string(p.Status),
		Deadline:   deadline,
		Notes:      server.FromNullable(p.Notes),
		CreatedAt:  p.CreatedAt,
		UpdatedAt:  p.UpdatedAt,
	}
}

// parseProjectStatus validates an incoming status string against the
// schema's ENUM and converts it to the typed value sqlc expects.
func parseProjectStatus(s string) (db.ProjectsStatus, bool) {
	switch s {
	case string(db.ProjectsStatusActive):
		return db.ProjectsStatusActive, true
	case string(db.ProjectsStatusOnHold):
		return db.ProjectsStatusOnHold, true
	case string(db.ProjectsStatusDone):
		return db.ProjectsStatusDone, true
	}
	return "", false
}

// parseDeadline converts "" to NULL or "YYYY-MM-DD" to a UTC midnight Time.
func parseDeadline(s string) (sql.NullTime, bool) {
	if s == "" {
		return sql.NullTime{}, true
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return sql.NullTime{}, false
	}
	return sql.NullTime{Time: t, Valid: true}, true
}

func (h *ProjectsHandler) List(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	statusParam := r.URL.Query().Get("status")
	var rows []db.Project
	var err error
	if statusParam != "" {
		status, valid := parseProjectStatus(statusParam)
		if !valid {
			server.WriteError(w, http.StatusBadRequest, "invalid_status", "status must be one of: active, on_hold, done")
			return
		}
		rows, err = h.Queries.ListProjectsByRolebookAndStatus(r.Context(), db.ListProjectsByRolebookAndStatusParams{
			RolebookID: rolebookID,
			Status:     status,
		})
	} else {
		rows, err = h.Queries.ListProjectsByRolebook(r.Context(), rolebookID)
	}
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to list projects")
		return
	}
	out := make([]projectResponse, 0, len(rows))
	for _, p := range rows {
		out = append(out, projectToResponse(p))
	}
	server.WriteJSON(w, http.StatusOK, out)
}

func (h *ProjectsHandler) Create(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	var req projectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_title", "title is required")
		return
	}
	if req.Status == "" {
		req.Status = string(db.ProjectsStatusActive)
	}
	status, valid := parseProjectStatus(req.Status)
	if !valid {
		server.WriteError(w, http.StatusBadRequest, "invalid_status", "status must be one of: active, on_hold, done")
		return
	}
	deadline, valid := parseDeadline(req.Deadline)
	if !valid {
		server.WriteError(w, http.StatusBadRequest, "invalid_deadline", "deadline must be empty or YYYY-MM-DD")
		return
	}
	res, err := h.Queries.CreateProject(r.Context(), db.CreateProjectParams{
		RolebookID: rolebookID,
		Title:      req.Title,
		Status:     status,
		Deadline:   deadline,
		Notes:      server.Nullable(req.Notes),
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create project")
		return
	}
	id, _ := res.LastInsertId()
	project, err := h.Queries.GetProjectByIDAndRolebook(r.Context(), db.GetProjectByIDAndRolebookParams{
		ID:         int32(id),
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "project created but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusCreated, projectToResponse(project))
}

func (h *ProjectsHandler) Update(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	var req projectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_title", "title is required")
		return
	}
	if req.Status == "" {
		req.Status = string(db.ProjectsStatusActive)
	}
	status, valid := parseProjectStatus(req.Status)
	if !valid {
		server.WriteError(w, http.StatusBadRequest, "invalid_status", "status must be one of: active, on_hold, done")
		return
	}
	deadline, valid := parseDeadline(req.Deadline)
	if !valid {
		server.WriteError(w, http.StatusBadRequest, "invalid_deadline", "deadline must be empty or YYYY-MM-DD")
		return
	}
	res, err := h.Queries.UpdateProject(r.Context(), db.UpdateProjectParams{
		ID:         id,
		RolebookID: rolebookID,
		Title:      req.Title,
		Status:     status,
		Deadline:   deadline,
		Notes:      server.Nullable(req.Notes),
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update project")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "project not found")
		return
	}
	project, err := h.Queries.GetProjectByIDAndRolebook(r.Context(), db.GetProjectByIDAndRolebookParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "project updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, projectToResponse(project))
}

func (h *ProjectsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	res, err := h.Queries.DeleteProject(r.Context(), db.DeleteProjectParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to delete project")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "project not found")
		return
	}
	server.WriteJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
