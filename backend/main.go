package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"

	db "github.com/Gtaylor0213/rolebook/backend/db/generated"
	"github.com/Gtaylor0213/rolebook/backend/internal/auth"
	"github.com/Gtaylor0213/rolebook/backend/internal/handlers"
)

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var not set: %s", key)
	}
	return v
}

func openDB() *sql.DB {
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "3306"
	}
	// go-sql-driver/mysql scans TINYINT(1) into Go bool natively — no flag
	// needed. parseTime is required for time.Time scanning.
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=UTC",
		mustEnv("DB_USER"),
		mustEnv("DB_PASSWORD"),
		mustEnv("DB_HOST"),
		port,
		mustEnv("DB_NAME"),
	)
	pool, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	pool.SetMaxOpenConns(20)
	pool.SetMaxIdleConns(5)
	pool.SetConnMaxLifetime(5 * time.Minute)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := pool.PingContext(ctx); err != nil {
		log.Fatalf("ping db: %v", err)
	}
	return pool
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "rolebook",
	})
}

func main() {
	pool := openDB()
	defer pool.Close()

	queries := db.New(pool)
	authHandler := &handlers.AuthHandler{Queries: queries}
	rolebookHandler := &handlers.RolebookHandler{Queries: queries}
	contactsHandler := &handlers.ContactsHandler{Queries: queries}
	projectsHandler := &handlers.ProjectsHandler{Queries: queries}
	subtasksHandler := &handlers.SubtasksHandler{Queries: queries}
	softwareHandler := &handlers.SoftwareHandler{Queries: queries}
	recurringHandler := &handlers.RecurringTasksHandler{Queries: queries}
	notesHandler := &handlers.NotesHandler{Queries: queries}
	exportHandler := &handlers.ExportHandler{Queries: queries}
	requireAuth := auth.RequireAuth(queries)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", healthHandler)

	// auth
	mux.HandleFunc("POST /api/auth/signup", authHandler.Signup)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/auth/logout", authHandler.Logout)
	mux.HandleFunc("GET /api/auth/me", requireAuth(authHandler.Me))

	// rolebook container
	mux.HandleFunc("GET /api/rolebook", requireAuth(rolebookHandler.Get))
	mux.HandleFunc("POST /api/rolebook", requireAuth(rolebookHandler.Create))
	mux.HandleFunc("PUT /api/rolebook", requireAuth(rolebookHandler.Update))
	mux.HandleFunc("POST /api/rolebook/transfer", requireAuth(rolebookHandler.Transfer))
	mux.HandleFunc("GET /api/rolebook/export", requireAuth(exportHandler.PDF))

	// contacts
	mux.HandleFunc("GET /api/contacts", requireAuth(contactsHandler.List))
	mux.HandleFunc("POST /api/contacts", requireAuth(contactsHandler.Create))
	mux.HandleFunc("PUT /api/contacts/{id}", requireAuth(contactsHandler.Update))
	mux.HandleFunc("PUT /api/contacts/{id}/favorite", requireAuth(contactsHandler.SetFavorite))
	mux.HandleFunc("DELETE /api/contacts/{id}", requireAuth(contactsHandler.Delete))

	// projects
	mux.HandleFunc("GET /api/projects", requireAuth(projectsHandler.List))
	mux.HandleFunc("POST /api/projects", requireAuth(projectsHandler.Create))
	mux.HandleFunc("PUT /api/projects/{id}", requireAuth(projectsHandler.Update))
	mux.HandleFunc("DELETE /api/projects/{id}", requireAuth(projectsHandler.Delete))

	// project subtasks (nested under a project)
	mux.HandleFunc("POST /api/projects/{id}/subtasks", requireAuth(subtasksHandler.Create))
	mux.HandleFunc("PUT /api/projects/{id}/subtasks/{subtask_id}", requireAuth(subtasksHandler.Update))
	mux.HandleFunc("DELETE /api/projects/{id}/subtasks/{subtask_id}", requireAuth(subtasksHandler.Delete))

	// software
	mux.HandleFunc("GET /api/software", requireAuth(softwareHandler.List))
	mux.HandleFunc("POST /api/software", requireAuth(softwareHandler.Create))
	mux.HandleFunc("PUT /api/software/{id}", requireAuth(softwareHandler.Update))
	mux.HandleFunc("DELETE /api/software/{id}", requireAuth(softwareHandler.Delete))

	// recurring tasks
	mux.HandleFunc("GET /api/recurring-tasks", requireAuth(recurringHandler.List))
	mux.HandleFunc("POST /api/recurring-tasks", requireAuth(recurringHandler.Create))
	mux.HandleFunc("PUT /api/recurring-tasks/{id}", requireAuth(recurringHandler.Update))
	mux.HandleFunc("DELETE /api/recurring-tasks/{id}", requireAuth(recurringHandler.Delete))

	// notes
	mux.HandleFunc("GET /api/notes", requireAuth(notesHandler.List))
	mux.HandleFunc("POST /api/notes", requireAuth(notesHandler.Create))
	mux.HandleFunc("PUT /api/notes/{id}", requireAuth(notesHandler.Update))
	mux.HandleFunc("DELETE /api/notes/{id}", requireAuth(notesHandler.Delete))

	addr := ":8080"
	log.Printf("rolebook-server listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
