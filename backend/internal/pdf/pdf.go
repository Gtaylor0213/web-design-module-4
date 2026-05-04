// Package pdf renders a Rolebook as a PDF for export. The output is plain
// black-and-white Helvetica with section headings and per-entry blocks —
// readable but not styled. The fallback path documented in
// docs/project-proposal.md (browser-print HTML/CSS) was not needed.
package pdf

import (
	"bytes"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
)

// Data is the input to Generate. It bundles the rolebook record with all
// five section tables, fetched per request from the handler.
type Data struct {
	Rolebook       db.Rolebook
	Contacts       []db.Contact
	Projects       []db.Project
	Software       []db.Software
	RecurringTasks []db.RecurringTask
	Notes          []db.Note
	ExportedAt     time.Time
}

// Generate renders the PDF and returns the bytes ready to write to an
// HTTP response (Content-Type: application/pdf).
func Generate(d Data) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "Letter", "")
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(true, 20)
	pdf.AddPage()

	// Document header: role title in big bold, then the export date in muted gray.
	pdf.SetFont("Helvetica", "B", 18)
	pdf.MultiCell(0, 9, sanitize(d.Rolebook.RoleTitle), "", "L", false)
	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(120, 120, 120)
	pdf.Cell(0, 5, "Exported "+d.ExportedAt.UTC().Format("Jan 2, 2006"))
	pdf.SetTextColor(0, 0, 0)
	pdf.Ln(10)

	renderSection(pdf, "Contacts", len(d.Contacts), func() {
		for _, c := range d.Contacts {
			renderContact(pdf, c)
		}
	})
	renderSection(pdf, "Projects", len(d.Projects), func() {
		for _, p := range d.Projects {
			renderProject(pdf, p)
		}
	})
	renderSection(pdf, "Software & Systems", len(d.Software), func() {
		for _, s := range d.Software {
			renderSoftware(pdf, s)
		}
	})
	renderSection(pdf, "Recurring Tasks", len(d.RecurringTasks), func() {
		for _, t := range d.RecurringTasks {
			renderRecurring(pdf, t)
		}
	})
	renderSection(pdf, "Notes", len(d.Notes), func() {
		for _, n := range d.Notes {
			renderNote(pdf, n)
		}
	})

	if err := pdf.Error(); err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func renderSection(pdf *gofpdf.Fpdf, name string, count int, body func()) {
	pdf.SetFont("Helvetica", "B", 14)
	pdf.Cell(0, 8, name)
	pdf.Ln(7)
	pdf.SetDrawColor(180, 180, 180)
	x, y := pdf.GetX(), pdf.GetY()
	pdf.Line(x, y, x+180, y)
	pdf.Ln(3)
	pdf.SetDrawColor(0, 0, 0)

	if count == 0 {
		pdf.SetFont("Helvetica", "I", 10)
		pdf.SetTextColor(120, 120, 120)
		pdf.Cell(0, 6, "No entries yet")
		pdf.SetTextColor(0, 0, 0)
		pdf.Ln(8)
		return
	}
	body()
	pdf.Ln(2)
}

func renderContact(pdf *gofpdf.Fpdf, c db.Contact) {
	entryTitle(pdf, c.Name)
	field(pdf, "Role", nullStr(c.Role))
	field(pdf, "Communication", nullStr(c.CommunicationPreferences))
	field(pdf, "Notes", nullStr(c.RelationshipNotes))
	field(pdf, "Watch out for", nullStr(c.WatchOutFor))
	pdf.Ln(2)
}

func renderProject(pdf *gofpdf.Fpdf, p db.Project) {
	entryTitle(pdf, fmt.Sprintf("%s [%s]", p.Title, statusLabel(string(p.Status))))
	if p.Deadline.Valid {
		field(pdf, "Deadline", p.Deadline.Time.Format("Jan 2, 2006"))
	}
	field(pdf, "Notes", nullStr(p.Notes))
	pdf.Ln(2)
}

func renderSoftware(pdf *gofpdf.Fpdf, s db.Software) {
	entryTitle(pdf, s.Name)
	field(pdf, "Purpose", nullStr(s.Purpose))
	field(pdf, "Credentials", nullStr(s.CredentialsLocation))
	field(pdf, "Notes", nullStr(s.Notes))
	pdf.Ln(2)
}

func renderRecurring(pdf *gofpdf.Fpdf, t db.RecurringTask) {
	entryTitle(pdf, fmt.Sprintf("%s [%s]", t.Name, cadenceLabel(string(t.Cadence))))
	field(pdf, "Notes", nullStr(t.Notes))
	pdf.Ln(2)
}

func renderNote(pdf *gofpdf.Fpdf, n db.Note) {
	entryTitle(pdf, n.Title)
	pdf.SetFont("Helvetica", "", 10)
	pdf.MultiCell(0, 5, sanitize(n.Body), "", "L", false)
	pdf.Ln(2)
}

func entryTitle(pdf *gofpdf.Fpdf, s string) {
	pdf.SetFont("Helvetica", "B", 11)
	pdf.MultiCell(0, 6, sanitize(s), "", "L", false)
}

// field renders one labeled line. Skips entirely if value is "".
func field(pdf *gofpdf.Fpdf, label, value string) {
	if value == "" {
		return
	}
	const labelWidth = 35.0
	pdf.SetFont("Helvetica", "B", 10)
	startX, startY := pdf.GetX(), pdf.GetY()
	pdf.CellFormat(labelWidth, 5, label+":", "", 0, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetXY(startX+labelWidth, startY)
	pdf.MultiCell(0, 5, sanitize(value), "", "L", false)
}

func nullStr(n sql.NullString) string {
	if !n.Valid {
		return ""
	}
	return n.String
}

func statusLabel(s string) string {
	switch s {
	case "active":
		return "Active"
	case "on_hold":
		return "On Hold"
	case "done":
		return "Done"
	}
	return s
}

func cadenceLabel(s string) string {
	switch s {
	case "weekly":
		return "Weekly"
	case "monthly":
		return "Monthly"
	case "semester":
		return "Semester"
	case "ad_hoc":
		return "Ad-hoc"
	}
	return s
}

// sanitize swaps a handful of common Unicode punctuation for ASCII so the
// default Helvetica/cp1252 encoding doesn't drop characters silently. For
// rich Unicode (anything beyond Latin-1) we'd switch to a UTF-8 TTF font.
func sanitize(s string) string {
	return strings.NewReplacer(
		"–", "-",
		"—", "-",
		"‘", "'",
		"’", "'",
		"“", "\"",
		"”", "\"",
		"…", "...",
		"•", "*",
	).Replace(s)
}
