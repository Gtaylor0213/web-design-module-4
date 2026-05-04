package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type RecurringTasksHandler struct {
	Queries *db.Queries
}

type recurringTaskRequest struct {
	Name    string `json:"name"`
	Cadence string `json:"cadence"`
	Notes   string `json:"notes"`
}

type recurringTaskResponse struct {
	ID         int32     `json:"id"`
	RolebookID int32     `json:"rolebook_id"`
	Name       string    `json:"name"`
	Cadence    string    `json:"cadence"`
	Notes      string    `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func recurringTaskToResponse(t db.RecurringTask) recurringTaskResponse {
	return recurringTaskResponse{
		ID:         t.ID,
		RolebookID: t.RolebookID,
		Name:       t.Name,
		Cadence:    string(t.Cadence),
		Notes:      server.FromNullable(t.Notes),
		CreatedAt:  t.CreatedAt,
		UpdatedAt:  t.UpdatedAt,
	}
}

// parseCadence validates an incoming cadence string against the schema's
// ENUM and converts it to the typed value sqlc expects.
func parseCadence(s string) (db.RecurringTasksCadence, bool) {
	switch s {
	case string(db.RecurringTasksCadenceWeekly):
		return db.RecurringTasksCadenceWeekly, true
	case string(db.RecurringTasksCadenceMonthly):
		return db.RecurringTasksCadenceMonthly, true
	case string(db.RecurringTasksCadenceSemester):
		return db.RecurringTasksCadenceSemester, true
	case string(db.RecurringTasksCadenceAdHoc):
		return db.RecurringTasksCadenceAdHoc, true
	}
	return "", false
}

func (h *RecurringTasksHandler) List(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	rows, err := h.Queries.ListRecurringTasksByRolebook(r.Context(), rolebookID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to list recurring tasks")
		return
	}
	out := make([]recurringTaskResponse, 0, len(rows))
	for _, t := range rows {
		out = append(out, recurringTaskToResponse(t))
	}
	server.WriteJSON(w, http.StatusOK, out)
}

func (h *RecurringTasksHandler) Create(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	var req recurringTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_name", "name is required")
		return
	}
	cadence, valid := parseCadence(req.Cadence)
	if !valid {
		server.WriteError(w, http.StatusBadRequest, "invalid_cadence", "cadence must be one of: weekly, monthly, semester, ad_hoc")
		return
	}
	res, err := h.Queries.CreateRecurringTask(r.Context(), db.CreateRecurringTaskParams{
		RolebookID: rolebookID,
		Name:       req.Name,
		Cadence:    cadence,
		Notes:      server.Nullable(req.Notes),
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to create recurring task")
		return
	}
	id, _ := res.LastInsertId()
	task, err := h.Queries.GetRecurringTaskByIDAndRolebook(r.Context(), db.GetRecurringTaskByIDAndRolebookParams{
		ID:         int32(id),
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "recurring task created but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusCreated, recurringTaskToResponse(task))
}

func (h *RecurringTasksHandler) Update(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	var req recurringTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		server.WriteError(w, http.StatusBadRequest, "invalid_json", "request body is not valid JSON")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		server.WriteError(w, http.StatusBadRequest, "invalid_name", "name is required")
		return
	}
	cadence, valid := parseCadence(req.Cadence)
	if !valid {
		server.WriteError(w, http.StatusBadRequest, "invalid_cadence", "cadence must be one of: weekly, monthly, semester, ad_hoc")
		return
	}
	res, err := h.Queries.UpdateRecurringTask(r.Context(), db.UpdateRecurringTaskParams{
		ID:         id,
		RolebookID: rolebookID,
		Name:       req.Name,
		Cadence:    cadence,
		Notes:      server.Nullable(req.Notes),
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to update recurring task")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "recurring task not found")
		return
	}
	task, err := h.Queries.GetRecurringTaskByIDAndRolebook(r.Context(), db.GetRecurringTaskByIDAndRolebookParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "recurring task updated but could not be fetched")
		return
	}
	server.WriteJSON(w, http.StatusOK, recurringTaskToResponse(task))
}

func (h *RecurringTasksHandler) Delete(w http.ResponseWriter, r *http.Request) {
	rolebookID, ok := requireRolebookID(w, r, h.Queries)
	if !ok {
		return
	}
	id, ok := parseIDPath(w, r)
	if !ok {
		return
	}
	res, err := h.Queries.DeleteRecurringTask(r.Context(), db.DeleteRecurringTaskParams{
		ID:         id,
		RolebookID: rolebookID,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to delete recurring task")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		server.WriteError(w, http.StatusNotFound, "not_found", "recurring task not found")
		return
	}
	server.WriteJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
