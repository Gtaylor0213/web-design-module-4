-- name: ListSoftwareByRolebook :many
SELECT id, rolebook_id, name, purpose, credentials_location, notes, created_at, updated_at
FROM software
WHERE rolebook_id = ?
ORDER BY id DESC;

-- name: GetSoftwareByIDAndRolebook :one
SELECT id, rolebook_id, name, purpose, credentials_location, notes, created_at, updated_at
FROM software
WHERE id = ? AND rolebook_id = ?
LIMIT 1;

-- name: CreateSoftware :execresult
INSERT INTO software (rolebook_id, name, purpose, credentials_location, notes)
VALUES (?, ?, ?, ?, ?);

-- name: UpdateSoftware :execresult
UPDATE software
SET name = ?, purpose = ?, credentials_location = ?, notes = ?
WHERE id = ? AND rolebook_id = ?;

-- name: DeleteSoftware :execresult
DELETE FROM software
WHERE id = ? AND rolebook_id = ?;
