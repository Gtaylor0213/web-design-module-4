-- name: ListRecurringTasksByRolebook :many
SELECT id, rolebook_id, name, cadence, notes, created_at, updated_at
FROM recurring_tasks
WHERE rolebook_id = ?
ORDER BY id DESC;

-- name: GetRecurringTaskByIDAndRolebook :one
SELECT id, rolebook_id, name, cadence, notes, created_at, updated_at
FROM recurring_tasks
WHERE id = ? AND rolebook_id = ?
LIMIT 1;

-- name: CreateRecurringTask :execresult
INSERT INTO recurring_tasks (rolebook_id, name, cadence, notes)
VALUES (?, ?, ?, ?);

-- name: UpdateRecurringTask :execresult
UPDATE recurring_tasks
SET name = ?, cadence = ?, notes = ?
WHERE id = ? AND rolebook_id = ?;

-- name: DeleteRecurringTask :execresult
DELETE FROM recurring_tasks
WHERE id = ? AND rolebook_id = ?;
