# Database Schema: Rolebook

This document describes the database structure for Rolebook. The database is MySQL. For API endpoints that read and write this data, see `architecture.md`.

## Overview

Seven tables, organized as one container per user (`rolebooks`) with five section tables hanging off each Rolebook:

```
users (auth and identity)
  │
  └─► rolebooks (one per user, owned by users.id)
        │
        ├─► contacts
        ├─► projects
        ├─► software
        ├─► recurring_tasks
        └─► notes
```

All section tables follow the same parent-child pattern: each entry belongs to exactly one Rolebook via `rolebook_id`. There are no many-to-many relationships in this schema.

## Tables

### users

Stores authenticated user accounts.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Used for login and as the lookup key for ownership transfer |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash, never store plaintext |
| `name` | VARCHAR(100) | NOT NULL | Display name shown in the UI |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

### rolebooks

Stores the Rolebook container itself. One per user (enforced at the application layer for MVP).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | |
| `owner_id` | INT | NOT NULL, FOREIGN KEY → users.id | Updates on ownership transfer |
| `role_title` | VARCHAR(200) | NOT NULL | e.g., "Graduate Assistant – E-Commerce Design Lab" |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

### contacts

People the user works with. One row per contact.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | |
| `rolebook_id` | INT | NOT NULL, FOREIGN KEY → rolebooks.id, ON DELETE CASCADE | |
| `name` | VARCHAR(150) | NOT NULL | |
| `role` | VARCHAR(150) | NULLABLE | e.g., "Faculty Advisor" |
| `relationship_notes` | TEXT | NULLABLE | How the user works with this contact |
| `communication_preferences` | TEXT | NULLABLE | "Prefers email over Teams" |
| `watch_out_for` | TEXT | NULLABLE | The "watch out for..." field |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

### projects

Bounded work with start and end. One row per project.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | |
| `rolebook_id` | INT | NOT NULL, FOREIGN KEY → rolebooks.id, ON DELETE CASCADE | |
| `title` | VARCHAR(200) | NOT NULL | |
| `status` | ENUM('active', 'on_hold', 'done') | NOT NULL, DEFAULT 'active' | |
| `deadline` | DATE | NULLABLE | |
| `notes` | TEXT | NULLABLE | What's happening on this project |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

### software

Tools and accounts used in the role. One row per software entry.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | |
| `rolebook_id` | INT | NOT NULL, FOREIGN KEY → rolebooks.id, ON DELETE CASCADE | |
| `name` | VARCHAR(150) | NOT NULL | e.g., "WordPress Admin" |
| `purpose` | VARCHAR(255) | NULLABLE | What it's used for |
| `credentials_location` | VARCHAR(255) | NULLABLE | "1Password under 'GA – WordPress'" — pointer only, not the credential |
| `notes` | TEXT | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

### recurring_tasks

Ongoing obligations with a cadence. One row per recurring task.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | |
| `rolebook_id` | INT | NOT NULL, FOREIGN KEY → rolebooks.id, ON DELETE CASCADE | |
| `name` | VARCHAR(200) | NOT NULL | |
| `cadence` | ENUM('weekly', 'monthly', 'semester', 'ad_hoc') | NOT NULL | |
| `notes` | TEXT | NULLABLE | Where files live, who to loop in |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

### notes

Freeform knowledge entries. One row per note.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | |
| `rolebook_id` | INT | NOT NULL, FOREIGN KEY → rolebooks.id, ON DELETE CASCADE | |
| `title` | VARCHAR(200) | NOT NULL | |
| `body` | TEXT | NOT NULL | The freeform content |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

## Relationships

- **users → rolebooks** (one-to-one in practice for MVP, enforced at the application layer): one user owns at most one Rolebook. The `rolebooks.owner_id` foreign key points to `users.id`.

- **rolebooks → section tables** (one-to-many): one Rolebook contains many contacts, projects, software entries, recurring tasks, and notes. Each section table has a `rolebook_id` foreign key. `ON DELETE CASCADE` ensures that deleting a Rolebook deletes all its child entries automatically.

There are no many-to-many relationships and no junction tables.

## Design Decisions

- **No `user_id` column on section tables.** Entries belong to a Rolebook, not directly to a user. This means ownership transfer requires only one update — `rolebooks.owner_id` — and all section entries automatically belong to the new owner because their `rolebook_id` doesn't change.

- **`ON DELETE CASCADE` on rolebook foreign keys.** If a Rolebook is deleted, its entries are cleaned up automatically. Prevents orphaned data.

- **No transfer history table for MVP.** Ownership transfer overwrites `rolebooks.owner_id`. Past owners are not tracked. This matches the "transfer history archive" item in the deferred features list.

- **No soft-delete columns.** Entries are hard-deleted. Soft-delete adds complexity (every query needs `WHERE deleted_at IS NULL`) without enough payoff for the MVP.

- **ENUM types for status and cadence.** Provides cheap database-level validation. Tradeoff is that adding new values requires `ALTER TABLE`. Documented in the project proposal's AI Review Decisions.

- **Consistent column naming.** All tables use `id`, `created_at`, `updated_at`. Section tables use `rolebook_id` for the foreign key. Predictable and easy to reason about.

- **VARCHAR vs TEXT.** Short, single-line fields use VARCHAR with explicit length limits. Multi-line freeform content uses TEXT. This is a sensible MySQL convention and helps the database optimize storage.

## Validation: Schema Supports All Features

Each must-have feature has a clear data home:

| Feature | Tables involved |
|---|---|
| Authentication and account setup | `users`, `rolebooks` |
| Five-section knowledge base | `contacts`, `projects`, `software`, `recurring_tasks`, `notes` |
| Tabbed dashboard | All section tables (read-only filtered by `rolebook_id`) |
| Export to PDF | `rolebooks` plus all five section tables |
| Transfer ownership | `users` (lookup by email), `rolebooks` (update `owner_id`) |

No must-have feature requires a table or column that isn't in this schema.
