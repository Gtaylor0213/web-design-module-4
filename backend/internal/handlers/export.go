package handlers

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/auth"
	"github.com/Gtaylor0213/rolebook/backend/internal/pdf"
	"github.com/Gtaylor0213/rolebook/backend/internal/server"
)

type ExportHandler struct {
	Queries *db.Queries
}

// PDF generates a PDF of the authenticated user's full Rolebook by reading
// all five section tables, building a pdf.Data, and streaming the bytes
// back as application/pdf with a Content-Disposition that suggests a
// reasonable filename based on the role title and today's date.
func (h *ExportHandler) PDF(w http.ResponseWriter, r *http.Request) {
	user, _ := auth.UserFrom(r.Context())
	ctx := r.Context()

	rolebook, err := h.Queries.GetRolebookByOwner(ctx, user.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			server.WriteError(w, http.StatusNotFound, "not_setup", "create a rolebook first via POST /api/rolebook")
			return
		}
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch rolebook")
		return
	}

	contacts, err := h.Queries.ListContactsByRolebook(ctx, rolebook.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch contacts")
		return
	}
	projects, err := h.Queries.ListProjectsByRolebook(ctx, rolebook.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch projects")
		return
	}
	software, err := h.Queries.ListSoftwareByRolebook(ctx, rolebook.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch software")
		return
	}
	recurring, err := h.Queries.ListRecurringTasksByRolebook(ctx, rolebook.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch recurring tasks")
		return
	}
	notes, err := h.Queries.ListNotesByRolebook(ctx, rolebook.ID)
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to fetch notes")
		return
	}

	now := time.Now().UTC()
	bytes, err := pdf.Generate(pdf.Data{
		Rolebook:       rolebook,
		Contacts:       contacts,
		Projects:       projects,
		Software:       software,
		RecurringTasks: recurring,
		Notes:          notes,
		ExportedAt:     now,
	})
	if err != nil {
		server.WriteError(w, http.StatusInternalServerError, "internal", "failed to generate pdf")
		return
	}

	filename := fmt.Sprintf("rolebook-%s-%s.pdf", slugify(rolebook.RoleTitle), now.Format("2006-01-02"))
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(bytes)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(bytes)
}

// slugify produces a filesystem-friendly version of a string. Lowercases
// alphanumerics, collapses everything else into hyphens, trims edges.
// "Graduate Assistant – Data Science Lab" -> "graduate-assistant-data-science-lab"
func slugify(s string) string {
	var b strings.Builder
	prevHyphen := true // suppress leading hyphens
	for _, r := range s {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(unicode.ToLower(r))
			prevHyphen = false
		default:
			if !prevHyphen {
				b.WriteByte('-')
				prevHyphen = true
			}
		}
	}
	out := strings.TrimRight(b.String(), "-")
	if out == "" {
		return "rolebook"
	}
	return out
}
