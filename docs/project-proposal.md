# Project Proposal: Rolebook

## Overview

**Project Name:** Rolebook

**Target Audience:** People in roles with significant ongoing responsibility — graduate assistants, knowledge workers, managers, coordinators, anyone whose job involves managing a web of contacts, projects, recurring obligations, and accumulated know-how. The common thread is having a job that is too complex to keep entirely in your head but not structured enough to fit neatly into existing tools like a project manager or a CRM.

**Core Problem:** Most jobs come with a tangle of contacts, ongoing projects, recurring tasks, software accounts, and learned knowledge that has no single home. People end up scattering this information across notes apps, Slack threads, browser bookmarks, sticky notes, and their own memory. The cost shows up in two places: day-to-day, when you waste time hunting for the thing you know you saw somewhere; and at transitions, when leaving the role means either writing a frantic handoff document from scratch or leaving your successor to reconstruct everything from nothing.

**Value Proposition:** Rolebook helps people in complex roles to keep their work organized in one place by giving them a structured knowledge base for contacts, projects, software, recurring tasks, and notes — and when the role passes to someone else, the same knowledge base becomes the handoff document, exportable to PDF or transferable to a successor's account.

## Feature Scope

### Must-Have (MVP)

1. **Authentication and account setup** — Sign up, log in, log out. On first signup, the user is prompted to name their role to initialize their Rolebook.

2. **Five-section knowledge base** — Within their Rolebook, users can add, edit, and delete entries in five sections:
   - **Contacts** — people they work with (name, role, relationship notes, communication preferences, "watch out for" field)
   - **Projects** — bounded work with status (active, on hold, done), optional deadline, and notes
   - **Software & Systems** — tools and accounts used (name, purpose, where credentials are stored — pointer only, not the credential itself)
   - **Recurring Tasks** — ongoing obligations with cadence (weekly, monthly, semester, ad-hoc) and notes about where files live or who to loop in
   - **Notes** — freeform knowledge entries with a title and body, for tribal knowledge, learned tricks, and anything that doesn't fit elsewhere

3. **Tabbed dashboard** — When users log in, they land on a dashboard with section tabs (Contacts, Projects, Software, Recurring, Notes). Each tab shows that section's entries with inline add/edit/delete actions.

4. **Export to PDF** — Generate a clean, formatted PDF of the entire Rolebook. Useful for archiving, for sharing with someone outside the system, or for handing off to a successor who doesn't have an account.

5. **Transfer ownership** — The current owner can transfer their Rolebook to another Rolebook user by email address. After transfer, the new owner has full edit access and the previous owner no longer does. The new owner can continue building on the existing knowledge base as they grow into the role.

### Deferred (Not Building Yet)

- **Multiple Rolebooks per user** — Supporting people with more than one role at once (e.g., a job plus a volunteer position).
- **Dashboard summary view** — A "what's happening this week" overview surfacing recurring tasks due, project deadlines, and recent activity across sections.
- **Search and tags** — Filtering entries by keyword or category.
- **Comments and questions** — Successors leaving questions on entries for the previous owner to answer before transfer.
- **Shareable read-only links** — Public links to view a Rolebook without an account.
- **Templates for common roles** — Pre-built section structures for "graduate assistant," "manager," etc.
- **Transfer history archive** — Viewing the chain of past owners for a Rolebook.
- **Notifications** — Email alerts when a Rolebook is transferred to you, or reminders for upcoming recurring tasks.
- **Rich text editing** — Formatted notes with headings, links, lists.
- **Project subtasks** — Breaking projects into smaller checklist items.

## AI Review Decisions

This section documents critiques raised during the design process and the decisions made in response.

### Suggestion: Five sections is a lot of CRUD work for an MVP
- **Decision:** Accepted as a known risk, no change to scope
- **Reason:** The five sections are the core product — fewer sections would make Rolebook indistinguishable from a generic note-taking app. The CRUD pattern is highly repetitive across sections, so once one is built the others follow the same template. Fallback plan: if Module 6 frontend work runs long, merge Software into Notes (treat software as a tagged note type). This is a known cut to make under pressure, not a planned cut.

### Suggestion: PDF generation is the riskiest must-have feature
- **Decision:** Accepted with a fallback plan
- **Reason:** PDF generation in Go can rabbit-hole on styling and layout. If the PDF library work gets stuck, the fallback is a browser print view with print-friendly CSS — same goal (clean output for the successor), much less library-fighting. The fallback would not require changing the API contract since `GET /api/rolebook/export` could return HTML in that case.

### Suggestion: Transfer to a non-existent user account
- **Decision:** MVP rejects with an error message; invitation email is deferred
- **Reason:** Sending invitation emails to onboard a new user adds email infrastructure (SMTP, deliverability, templated emails) that is not worth the build cost for MVP. Rejecting with a clear error ("That email isn't registered with Rolebook — ask them to sign up first") is a fine UX for the MVP.

### Suggestion: Single-Rolebook-per-user is a limitation
- **Decision:** Deliberate constraint, documented as such
- **Reason:** Multi-Rolebook support would complicate the data model (URLs would need to include rolebook IDs, ownership transfer would be per-Rolebook), the UI (which Rolebook am I looking at?), and the user mental model. For MVP, "one Rolebook per current role" matches how most people experience their work. Multi-Rolebook is in the deferred list for users who eventually want it.

### Suggestion: ENUM types in MySQL are inflexible for status fields
- **Decision:** Accepted ENUMs for MVP, may revisit later
- **Reason:** The status values for projects (active, on_hold, done) and recurring task cadence (weekly, monthly, semester, ad_hoc) are stable and unlikely to change. ENUMs give cheap database-level validation. If the lists need to change, an `ALTER TABLE` is a known cost. Alternative (VARCHAR with application validation, or lookup tables) is documented but not chosen.

### Suggestion: No rate limiting or CSRF protection in design
- **Decision:** Out of scope for student project
- **Reason:** These are production hardening concerns. Documenting them here as known gaps so they're not silently missing. For a deployed student project on Lightsail, this is acceptable risk.

### Suggestion: PDF export depends on a Go PDF library
- **Decision:** Will use `gofpdf` or similar standard Go library
- **Reason:** Pure-Go PDF libraries avoid system dependencies (no need to install LaTeX or wkhtmltopdf on Lightsail). `gofpdf` is the most established option. Styling will be basic — section headings, entry blocks, plain typography. No need for fancy layouts.

### Suggestion: Six must-haves is over the assignment's "3-5" guideline
- **Decision:** Defended as substantively five
- **Reason:** Of the six listed must-haves, "Authentication and account setup" is foundational infrastructure rather than a substantive feature. The five substantive features are the knowledge base, the tabbed dashboard, PDF export, and transfer ownership. Authentication is grouped as one item because login, signup, and onboarding share the same code surface.
