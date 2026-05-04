# CLAUDE.md

This file provides context for AI coding assistants (Claude Code, Cursor, etc.) working on this project. Read this before making changes.

## What This Project Is

Rolebook is a personal knowledge base for people in roles with significant ongoing responsibility. Users organize their work into five sections — Contacts, Projects, Software, Recurring Tasks, and Notes — and can export their Rolebook to PDF or transfer it to a successor when leaving the role.

This is a Module 4-7 independent project for the Web Design AI course. It builds on infrastructure patterns established in Modules 1-3 (GitHub Actions deployment to AWS Lightsail, HTTPS on a custom domain).

For the full vision, scope, and feature list, see `docs/project-proposal.md`.

## Repository Layout

```
/
├── frontend/                       React 19 + Vite + TS app
│   ├── src/
│   │   ├── pages/                  Top-level routes
│   │   │   └── sections/           One file per section CRUD UI
│   │   ├── components/
│   │   │   └── ui/                 shadcn/ui generated primitives
│   │   ├── hooks/                  useAuth, useRolebook, usePageTitle
│   │   └── lib/                    Typed fetch client, types, CRUD helpers
│   ├── package.json
│   └── vite.config.ts
├── backend/                        Go REST API
│   ├── main.go                     Wire-up, route mounting
│   ├── schema.sql                  Source of truth for the DB schema
│   ├── sqlc.yaml
│   ├── db/
│   │   ├── queries/                Hand-written SQL files
│   │   └── generated/              sqlc-generated Go (committed)
│   └── internal/
│       ├── auth/                   Passwords, sessions, middleware
│       ├── handlers/               One file per resource
│       ├── server/                 JSON helpers
│       └── pdf/                    gofpdf-based PDF generator
├── docs/
│   ├── project-proposal.md         What we're building and why
│   ├── architecture.md             Pages, navigation, API design
│   ├── database-schema.md          Tables, columns, relationships
│   └── deployment-setup.md         Lightsail server runbook
├── .github/
│   └── workflows/deploy.yml        Build + rsync + restart on push to main
├── issues.json                     Source for the original 30 GitHub issues
├── CLAUDE.md                       This file
└── README.md                       Human-readable project overview
```

## Tech Stack

### Backend
- **Go 1.23** with the `net/http` standard library — no third-party HTTP framework or router
- **Go 1.22+ ServeMux path parameters** (`{id}` syntax) for routing
- **sqlc** generates type-safe Go from SQL queries — write SQL, not ORM calls
- **bcrypt** (`golang.org/x/crypto/bcrypt`) for password hashing
- PDF generation: `gofpdf` (fallback: print-friendly CSS in the browser)

### Frontend
- **React 19** with **Vite** as the dev server and build tool
- **Tailwind CSS v4** for utility-first styling
- **shadcn/ui** (built on Radix UI primitives) for accessible components — buttons, dialogs, selects, inputs
- **TanStack Query** (React Query) for server state, caching, and mutations
- **Sonner** for toast notifications
- **Lucide React** for icons

### Database
- **MySQL 8.0** with foreign key constraints (see `docs/database-schema.md`)

### Infrastructure & Deployment
- **AWS Lightsail** Ubuntu VPS at `3.133.79.69`
- **nginx** as reverse proxy: serves the built frontend, proxies `/api/*` to the backend
- **systemd** runs the Go backend as `rolebook-backend.service`
- **GitHub Actions** builds and deploys on push to `main`
- HTTPS on a custom domain

## Architectural Decisions

These decisions are made and should not be revisited without explicit discussion:

1. **One Rolebook per user.** Multi-Rolebook support is deferred. URLs do not include a rolebook ID — the backend infers the user's Rolebook from the auth context.

2. **Ownership transfer overwrites the owner.** No transfer history is tracked in the MVP. After transfer, the previous owner has no access.

3. **Authentication scopes everything.** Every section endpoint filters by the authenticated user's Rolebook. There are no public endpoints other than signup, login, and the landing page.

4. **Entries belong to Rolebooks, not directly to users.** Section tables have `rolebook_id`, not `user_id`. This makes ownership transfer a single-row update.

5. **Hard deletes, no soft delete.** Deleted entries are gone. No `deleted_at` columns.

6. **PDF export uses a Go PDF library** (likely `gofpdf`). Fallback if PDF generation gets gnarly: browser print view with print-friendly CSS.

7. **Tabbed dashboard, not stacked.** Sections are accessed via tabs at routes like `/dashboard/contacts`, not as one long scroll.

## Common Workflows

### Running locally
- Backend: `cd backend && go run .` (port 8080)
- Frontend: `cd frontend && npm run dev` (Vite default port)
- Database: MySQL on the default port. Apply the schema with `mysql rolebook < backend/schema.sql`. The design rationale lives in `docs/database-schema.md`; `backend/schema.sql` is the executable source of truth.

### Adding a new section field
1. Update the column in `backend/schema.sql` (the executable schema)
2. Update the matching table description in `docs/database-schema.md` so the design doc stays in sync
3. Write a migration (or, for early MVP, drop and re-create the affected table from the updated `schema.sql`)
4. Update the Go struct in `backend/`
5. Update the request/response DTOs and validation
6. Update the React form component for the section
7. Update the entry card display

### Implementing a new endpoint
1. Confirm it's documented in `docs/architecture.md` — if not, update there first
2. Implement the handler in the appropriate Go package
3. Wire the route in the router
4. Verify the auth middleware is applied
5. Verify ownership scoping (the handler must filter by the authenticated user's Rolebook)

## Things to Watch Out For

- **Ownership scoping is a security boundary.** Any handler that reads or writes section data must verify the entry's `rolebook_id` matches the authenticated user's Rolebook. Forgetting this is a horizontal privilege escalation bug.
- **The `transfer ownership` endpoint** must verify the target email has a registered account before doing the update. If not, return 404 with a clear error.
- **PDF generation can rabbit-hole.** If styling is taking more than two hours, fall back to the browser-print approach.
- **ENUM values in MySQL** require ALTER TABLE to change. Don't add new values without updating both the database and the Go code.

## What This Project Is Not

- Not a CRM. Contacts are personal notes about people, not a sales pipeline.
- Not a task manager. Recurring tasks are reminders of what the role involves, not assignments with due dates.
- Not collaborative. One owner at a time, no shared editing.
- Not a wiki. Notes are unstructured but the rest of the data model is highly structured.
