# Rolebook

A personal knowledge base for your role.

Rolebook gives people in complex roles a structured place to organize their work — contacts, projects, software, recurring tasks, and notes — instead of scattering it across notes apps, Slack threads, and sticky notes. When the role passes to someone else, the same Rolebook becomes the handoff document, exportable to PDF or transferable to a successor's account.

## Why Rolebook Exists

Most jobs come with a tangle of contacts, ongoing projects, recurring tasks, software accounts, and learned knowledge that has no single home. The cost shows up in two places:

- **Day-to-day:** time wasted hunting for the thing you know you saw somewhere
- **At transitions:** writing a frantic handoff document from scratch, or leaving your successor to reconstruct everything from nothing

Rolebook solves both by giving you a structured ongoing knowledge base that doubles as a handoff artifact when you leave.

## Features

- **Five-section knowledge base** — Contacts, Projects, Software, Recurring Tasks, Notes
- **Tabbed dashboard** — switch between sections with a click
- **PDF export** — clean, formatted output for archiving or sharing
- **Ownership transfer** — pass your Rolebook to a successor by email so they can keep building on it

## Tech Stack

**Frontend:** React 19 + Vite, Tailwind CSS v4, shadcn/ui (Radix UI primitives), TanStack Query, Sonner, Lucide React

**Backend:** Go 1.22 (`net/http` standard library, Go 1.22+ ServeMux path params), sqlc for type-safe queries, bcrypt for password hashing, gofpdf for PDF export

**Database:** MySQL 8.0

**Infrastructure:** AWS Lightsail (Ubuntu VPS) with nginx reverse proxy and a systemd-managed Go service (`rolebook-backend.service`); GitHub Actions for CI/CD on push to `main`; HTTPS on a custom domain

## Project Structure

```
/frontend     React app
/backend      Go API
/docs         Project documentation (proposal, architecture, schema)
```

## Live demo

Production URL: **https://gracie-webdesign.me**

Test account (full Rolebook with sample data already populated):

```
Email:    gracie@example.com
Password: correct-horse-battery-staple
```

Once logged in, the dashboard shows the five sections. Try adding,
editing, and deleting entries; downloading the PDF export from the
toolbar; or visiting Settings to rename the role title.

## Getting started locally

### Prerequisites
- Go 1.22 or later
- Node.js 22 or later
- MySQL 8

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/Gtaylor0213/web-design-module-4.git rolebook
   cd rolebook
   ```

2. **Database:** create the `rolebook` database and load the schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE rolebook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p rolebook < backend/schema.sql
   ```

3. **Backend env vars:** the Go server reads connection info from
   environment variables. Set them however you prefer (export, .env
   file, systemd EnvironmentFile in production):
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=rolebook
   DB_PASSWORD=...
   DB_NAME=rolebook
   ```

4. **Run the backend:**
   ```bash
   cd backend && go run .
   # listens on :8080
   ```

5. **Run the frontend:**
   ```bash
   cd frontend && npm install && npm run dev
   ```
   The Vite dev server proxies `/api` to the production server by
   default (see `frontend/vite.config.ts`); change the `target` to
   `http://localhost:8080` to hit your local backend.

## Documentation

- [`docs/project-proposal.md`](docs/project-proposal.md) — what we're building, who it's for, and why
- [`docs/architecture.md`](docs/architecture.md) — pages, user flow, and API design
- [`docs/database-schema.md`](docs/database-schema.md) — database tables, columns, and relationships
- [`docs/deployment-setup.md`](docs/deployment-setup.md) — server setup runbook
- [`CLAUDE.md`](CLAUDE.md) — context file for AI coding assistants

## Project status

Built as the independent project for Modules 4–7 of the Web Design AI
course. **All four modules complete.**

- **Module 4** — Project proposal, documentation, infrastructure, deploy pipeline
- **Module 5** — Go backend: 30 REST endpoints, MySQL, bcrypt auth, session middleware, PDF export
- **Module 6** — React frontend: 8 pages, full CRUD UI for all five sections, PDF download, ownership transfer
- **Module 7** — Polish: brand color, accessibility improvements (skip link, focus rings, heading hierarchy, per-route page titles), 404 page
