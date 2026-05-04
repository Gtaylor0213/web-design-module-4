# Architecture: Rolebook

This document describes the application's pages, navigation flow, and API design. For database structure, see `database-schema.md`. For project goals and scope, see `project-proposal.md`.

## Pages

### Landing (`/`)
- **Purpose:** Welcome unauthenticated visitors. Brief explanation of what Rolebook is, with a Log In button and Sign Up link. Logged-in users get redirected to Dashboard.
- **How users arrive:** Direct navigation, or any link click while logged out (redirected here).

### Sign Up (`/signup`)
- **Purpose:** Create a new account with email, password, and name.
- **How users arrive:** "Sign up" link from the landing page.

### Log In (`/login`)
- **Purpose:** Authenticate an existing user with email and password.
- **How users arrive:** "Log in" button from the landing page, or after logging out.

### Onboarding (`/onboarding`)
- **Purpose:** First-time setup. Prompts the user to name their role (e.g., "Graduate Assistant – E-Commerce Design Lab") to initialize their Rolebook.
- **How users arrive:** Automatic redirect after first signup, or after login if the user has no Rolebook yet.

### Dashboard (`/dashboard/:section`)
- **Purpose:** The home of the app. Shows the user's role title at the top and one of five section tabs (Contacts, Projects, Software, Recurring, Notes). The active section displays its entries with inline add/edit/delete actions.
- **Default route:** `/dashboard` redirects to `/dashboard/contacts`.
- **How users arrive:** Default page after login, or clicking the logo from anywhere.

### Settings (`/settings`)
- **Purpose:** Edit role title, change password, log out. Includes a "Transfer my Rolebook" entry point.
- **How users arrive:** User menu in navigation header.

### Transfer Ownership (`/settings/transfer`)
- **Purpose:** Confirm and execute transferring the entire Rolebook to another user by email. Includes a clear warning that this is permanent and the user will lose access.
- **How users arrive:** "Transfer my Rolebook" button on Settings page.

## Navigation Flow

```
[Not logged in]
  Landing (/) ──► Sign Up ──► Onboarding ──► Dashboard
  Landing (/) ──► Log In ──────────────────► Dashboard
                                           (or Onboarding if no Rolebook yet)

[Logged in]
  Dashboard ──► [switch tabs: Contacts | Projects | Software | Recurring | Notes]
  Dashboard ──► [add/edit/delete entries within the current section]
  Dashboard ──► [PDF download triggered, stay on page]
  Dashboard ──► Settings ──► Transfer Ownership ──► Landing (after transfer, logged out)
  Dashboard ──► Settings ──► [edit role title / change password / log out]
```

## Walkthrough Validation

The page list and flow have been validated against the following user scenarios:

**Scenario 1: Daily-use update**
A user has a meeting and wants to update notes and a recurring task. Path: Dashboard → switch to Recurring tab → edit task → switch to Notes tab → add a new note. All within Dashboard, no extra navigation.

**Scenario 2: Initial setup**
A new user signs up. Path: Landing → Sign Up → Onboarding (set role title) → Dashboard. Three clicks to working state.

**Scenario 3: Role transition**
The user is leaving their role and transferring to a successor with a Rolebook account. Path: Dashboard → Settings → Transfer Ownership → confirm with successor's email → logged out, returned to Landing.

All five must-have features (auth, knowledge base, dashboard, PDF export, transfer) are reachable through this navigation.

## Shared Components

These components appear on multiple pages and will be implemented as reusable React components:

- **Navigation header** — Logo, role title, settings menu, logout. On every authenticated page.
- **Section tab bar** — The five-tab navigation on Dashboard (Contacts | Projects | Software | Recurring | Notes).
- **Entry card** — Visual representation of a single contact / project / software / recurring task / note. Section-specific variants but shared base structure.
- **Entry form modal** — Opens when adding or editing an entry. Section-specific fields inside, same modal shell.
- **Empty state** — Displayed in a section that has no entries yet.
- **Confirmation modal** — For delete actions and the transfer ownership confirmation.

## API Endpoints

All endpoints other than `/api/auth/signup` and `/api/auth/login` require authentication. Each authenticated request is scoped to the requesting user's Rolebook — users cannot access entries from another user's Rolebook.

### Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create a new account. Body: `{ email, password, name }`. Returns user info and auth token. |
| POST | `/api/auth/login` | Authenticate. Body: `{ email, password }`. Returns user info and auth token. |
| POST | `/api/auth/logout` | Invalidate the session. |
| GET | `/api/auth/me` | Get the currently authenticated user. Used on app load to check session validity. |

### Rolebook (the container)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/rolebook` | Get the current user's Rolebook (role title and metadata). 404 if not set up yet — frontend uses this to trigger onboarding. |
| POST | `/api/rolebook` | Create the Rolebook on first setup. Body: `{ role_title }`. |
| PUT | `/api/rolebook` | Update the Rolebook (e.g., edit the role title). Body: `{ role_title }`. |
| POST | `/api/rolebook/transfer` | Transfer ownership. Body: `{ new_owner_email }`. Returns success or error if the email doesn't have an account. |
| GET | `/api/rolebook/export` | Generate and return a PDF of the entire Rolebook. Response is `application/pdf`. |

### Contacts

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/contacts` | List all contacts in the user's Rolebook. |
| POST | `/api/contacts` | Create a new contact. Body: `{ name, role, relationship_notes, communication_preferences, watch_out_for }`. |
| PUT | `/api/contacts/:id` | Update a contact. Body: any subset of the fields above. |
| DELETE | `/api/contacts/:id` | Delete a contact. |

### Projects

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects` | List all projects. Optional query param `?status=active` to filter. |
| POST | `/api/projects` | Create a project. Body: `{ title, status, deadline, notes }`. |
| PUT | `/api/projects/:id` | Update a project. |
| DELETE | `/api/projects/:id` | Delete a project. |

### Software

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/software` | List all software entries. |
| POST | `/api/software` | Create a software entry. Body: `{ name, purpose, credentials_location, notes }`. |
| PUT | `/api/software/:id` | Update a software entry. |
| DELETE | `/api/software/:id` | Delete a software entry. |

### Recurring Tasks

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/recurring-tasks` | List all recurring tasks. |
| POST | `/api/recurring-tasks` | Create a recurring task. Body: `{ name, cadence, notes }`. |
| PUT | `/api/recurring-tasks/:id` | Update a recurring task. |
| DELETE | `/api/recurring-tasks/:id` | Delete a recurring task. |

### Notes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/notes` | List all notes. |
| POST | `/api/notes` | Create a note. Body: `{ title, body }`. |
| PUT | `/api/notes/:id` | Update a note. |
| DELETE | `/api/notes/:id` | Delete a note. |

## Example Request and Response

### POST /api/contacts

**Request:**
```json
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Dr. Jeannie Pridmore",
  "role": "Faculty Advisor",
  "relationship_notes": "Oversees the E-Commerce Design Lab and graduate assistantship work.",
  "communication_preferences": "Prefers email over Teams. Responds within a day.",
  "watch_out_for": "Always loop her in before sending anything client-facing for the Lab."
}
```

**Response:**
```json
201 Created
Content-Type: application/json

{
  "id": 12,
  "rolebook_id": 4,
  "name": "Dr. Jeannie Pridmore",
  "role": "Faculty Advisor",
  "relationship_notes": "Oversees the E-Commerce Design Lab and graduate assistantship work.",
  "communication_preferences": "Prefers email over Teams. Responds within a day.",
  "watch_out_for": "Always loop her in before sending anything client-facing for the Lab.",
  "created_at": "2026-04-15T14:32:01Z",
  "updated_at": "2026-04-15T14:32:01Z"
}
```

### POST /api/rolebook/transfer

**Request:**
```json
POST /api/rolebook/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "new_owner_email": "andrea@example.com"
}
```

**Success response:**
```json
200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Rolebook transferred to andrea@example.com. You no longer have access."
}
```

**Error response (recipient not registered):**
```json
404 Not Found
Content-Type: application/json

{
  "error": "no_account",
  "message": "That email isn't registered with Rolebook — ask them to sign up first."
}
```

## Validation: API Connects to Schema

Every endpoint reads from or writes to tables defined in `database-schema.md`. The connection is verified by tracing each frontend need:

- Listing entries on a section tab → `GET /api/<section>` → reads `<section>` table filtered by `rolebook_id`
- Adding an entry → `POST /api/<section>` → inserts into `<section>` with `rolebook_id` from auth context
- Editing an entry → `PUT /api/<section>/:id` → updates `<section>` after verifying the entry's `rolebook_id` matches the authenticated user's Rolebook
- Deleting an entry → `DELETE /api/<section>/:id` → deletes from `<section>` with the same ownership check
- PDF export → `GET /api/rolebook/export` → reads `rolebooks` and all five section tables, formats as PDF
- Transfer → `POST /api/rolebook/transfer` → looks up new owner in `users` by email, updates `rolebooks.owner_id`

No frontend feature requires data that isn't in the schema. No schema column is unused by an endpoint.
