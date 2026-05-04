-- name: ListNotesByRolebook :many
SELECT id, rolebook_id, title, body, created_at, updated_at
FROM notes
WHERE rolebook_id = ?
ORDER BY id DESC;

-- name: GetNoteByIDAndRolebook :one
SELECT id, rolebook_id, title, body, created_at, updated_at
FROM notes
WHERE id = ? AND rolebook_id = ?
LIMIT 1;

-- name: CreateNote :execresult
INSERT INTO notes (rolebook_id, title, body)
VALUES (?, ?, ?);

-- name: UpdateNote :execresult
UPDATE notes
SET title = ?, body = ?
WHERE id = ? AND rolebook_id = ?;

-- name: DeleteNote :execresult
DELETE FROM notes
WHERE id = ? AND rolebook_id = ?;
