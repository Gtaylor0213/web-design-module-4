-- name: ListProjectsByRolebook :many
SELECT id, rolebook_id, title, status, deadline, notes, created_at, updated_at
FROM projects
WHERE rolebook_id = ?
ORDER BY id DESC;

-- name: ListProjectsByRolebookAndStatus :many
SELECT id, rolebook_id, title, status, deadline, notes, created_at, updated_at
FROM projects
WHERE rolebook_id = ? AND status = ?
ORDER BY id DESC;

-- name: GetProjectByIDAndRolebook :one
SELECT id, rolebook_id, title, status, deadline, notes, created_at, updated_at
FROM projects
WHERE id = ? AND rolebook_id = ?
LIMIT 1;

-- name: CreateProject :execresult
INSERT INTO projects (rolebook_id, title, status, deadline, notes)
VALUES (?, ?, ?, ?, ?);

-- name: UpdateProject :execresult
UPDATE projects
SET title = ?, status = ?, deadline = ?, notes = ?
WHERE id = ? AND rolebook_id = ?;

-- name: DeleteProject :execresult
DELETE FROM projects
WHERE id = ? AND rolebook_id = ?;
