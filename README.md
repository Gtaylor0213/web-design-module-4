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

**Backend:** Go 1.23 (`net/http` standard library, Go 1.22+ ServeMux path params), sqlc for type-safe queries, bcrypt for password hashing

**Database:** MySQL 8.0

**Infrastructure:** AWS Lightsail (Ubuntu VPS) with nginx reverse proxy and a systemd-managed Go service (`rolebook-backend.service`); GitHub Actions for CI/CD on push to `main`; HTTPS on a custom domain

## Project Structure

```
/frontend     React app
/backend      Go API
/docs         Project documentation (proposal, architecture, schema)
```

## Getting Started Locally

### Prerequisites
- Go 1.21 or later
- Node.js 18 or later
- MySQL 8 or later

### Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd rolebook
   ```

2. Set up the database:
   ```
   mysql -u root -p < schema.sql
   ```
   (See `docs/database-schema.md` for the schema definition.)

3. Start the backend:
   ```
   cd backend
   go mod download
   go run .
   ```
   The API will listen on port 8080.

4. In another terminal, start the frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   The app will be available at the URL printed by Vite.

## Documentation

- [`docs/project-proposal.md`](docs/project-proposal.md) — what we're building, who it's for, and why
- [`docs/architecture.md`](docs/architecture.md) — pages, user flow, and API design
- [`docs/database-schema.md`](docs/database-schema.md) — database tables, columns, and relationships
- [`CLAUDE.md`](CLAUDE.md) — context file for AI coding assistants

## Project Status

This project is being built as the independent project for Modules 4-7 of the Web Design AI course.

- **Module 4 (current):** Project proposal, infrastructure setup, Hello World deployed
- **Module 5:** Backend with database and API endpoints
- **Module 6:** Frontend connected to backend
- **Module 7:** Final polish, presentation
