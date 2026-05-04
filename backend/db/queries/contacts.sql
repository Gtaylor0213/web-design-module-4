-- name: ListContactsByRolebook :many
SELECT id, rolebook_id, name, role, relationship_notes, communication_preferences, watch_out_for, created_at, updated_at
FROM contacts
WHERE rolebook_id = ?
ORDER BY id DESC;

-- name: GetContactByIDAndRolebook :one
SELECT id, rolebook_id, name, role, relationship_notes, communication_preferences, watch_out_for, created_at, updated_at
FROM contacts
WHERE id = ? AND rolebook_id = ?
LIMIT 1;

-- name: CreateContact :execresult
INSERT INTO contacts (rolebook_id, name, role, relationship_notes, communication_preferences, watch_out_for)
VALUES (?, ?, ?, ?, ?, ?);

-- name: UpdateContact :execresult
UPDATE contacts
SET name = ?, role = ?, relationship_notes = ?, communication_preferences = ?, watch_out_for = ?
WHERE id = ? AND rolebook_id = ?;

-- name: DeleteContact :execresult
DELETE FROM contacts
WHERE id = ? AND rolebook_id = ?;
