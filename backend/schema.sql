-- Rolebook database schema
--
-- Apply with: sudo mysql rolebook < backend/schema.sql
--
-- See docs/database-schema.md for the design rationale, including why we
-- use ON DELETE CASCADE on rolebook foreign keys, why ENUMs are acceptable
-- for status/cadence, and why one-rolebook-per-user is enforced at the
-- application layer rather than via a UNIQUE constraint on owner_id.
--
-- Order matters: users -> rolebooks -> (five section tables).
-- All section tables reference rolebooks(id) with ON DELETE CASCADE so
-- deleting a Rolebook removes its entries automatically.

-- ----------------------------------------------------------------------
-- users : authenticated accounts
-- ----------------------------------------------------------------------
CREATE TABLE users (
    id            INT          NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- rolebooks : the per-user knowledge-base container
-- ----------------------------------------------------------------------
CREATE TABLE rolebooks (
    id         INT          NOT NULL AUTO_INCREMENT,
    owner_id   INT          NOT NULL,
    role_title VARCHAR(200) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_rolebooks_owner (owner_id),
    CONSTRAINT fk_rolebooks_owner
        FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- contacts : people the user works with
-- ----------------------------------------------------------------------
CREATE TABLE contacts (
    id                        INT          NOT NULL AUTO_INCREMENT,
    rolebook_id               INT          NOT NULL,
    name                      VARCHAR(150) NOT NULL,
    role                      VARCHAR(150)     NULL,
    relationship_notes        TEXT             NULL,
    communication_preferences TEXT             NULL,
    watch_out_for             TEXT             NULL,
    favorite                  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_contacts_rolebook (rolebook_id),
    CONSTRAINT fk_contacts_rolebook
        FOREIGN KEY (rolebook_id) REFERENCES rolebooks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- projects : bounded work with status and optional deadline
-- ----------------------------------------------------------------------
CREATE TABLE projects (
    id          INT                                NOT NULL AUTO_INCREMENT,
    rolebook_id INT                                NOT NULL,
    title       VARCHAR(200)                       NOT NULL,
    status      ENUM('active','on_hold','done')    NOT NULL DEFAULT 'active',
    deadline    DATE                                   NULL,
    notes       TEXT                                   NULL,
    created_at  TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_projects_rolebook (rolebook_id),
    CONSTRAINT fk_projects_rolebook
        FOREIGN KEY (rolebook_id) REFERENCES rolebooks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- project_subtasks : checklist items inside a project
-- ----------------------------------------------------------------------
CREATE TABLE project_subtasks (
    id         INT          NOT NULL AUTO_INCREMENT,
    project_id INT          NOT NULL,
    title      VARCHAR(300) NOT NULL,
    completed  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_subtasks_project (project_id),
    CONSTRAINT fk_subtasks_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- software : tools and accounts used in the role
-- ----------------------------------------------------------------------
CREATE TABLE software (
    id                   INT          NOT NULL AUTO_INCREMENT,
    rolebook_id          INT          NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    purpose              VARCHAR(255)     NULL,
    credentials_location VARCHAR(255)     NULL,  -- pointer to where the credential is stored, NEVER the credential itself
    notes                TEXT             NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_software_rolebook (rolebook_id),
    CONSTRAINT fk_software_rolebook
        FOREIGN KEY (rolebook_id) REFERENCES rolebooks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- recurring_tasks : ongoing obligations with a cadence
-- ----------------------------------------------------------------------
CREATE TABLE recurring_tasks (
    id          INT                                              NOT NULL AUTO_INCREMENT,
    rolebook_id INT                                              NOT NULL,
    name        VARCHAR(200)                                     NOT NULL,
    cadence     ENUM('weekly','monthly','semester','ad_hoc')     NOT NULL,
    notes       TEXT                                                 NULL,
    created_at  TIMESTAMP                                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP                                        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_recurring_tasks_rolebook (rolebook_id),
    CONSTRAINT fk_recurring_tasks_rolebook
        FOREIGN KEY (rolebook_id) REFERENCES rolebooks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- notes : freeform knowledge entries
-- ----------------------------------------------------------------------
CREATE TABLE notes (
    id          INT          NOT NULL AUTO_INCREMENT,
    rolebook_id INT          NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notes_rolebook (rolebook_id),
    CONSTRAINT fk_notes_rolebook
        FOREIGN KEY (rolebook_id) REFERENCES rolebooks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- sessions : auth tokens issued at signup/login, looked up per-request
-- by the auth middleware. Opaque random tokens (no JWT). Logout deletes
-- the row; deleting a user cascades to their sessions.
-- ----------------------------------------------------------------------
CREATE TABLE sessions (
    id         INT          NOT NULL AUTO_INCREMENT,
    user_id    INT          NOT NULL,
    token      CHAR(64)     NOT NULL,  -- 32 random bytes, hex-encoded
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_sessions_token (token),
    KEY idx_sessions_user (user_id),
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
