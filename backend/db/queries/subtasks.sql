-- name: ListSubtasksByProject :many
SELECT id, project_id, title, completed, created_at, updated_at
FROM project_subtasks
WHERE project_id = ?
ORDER BY id ASC;

-- name: ListSubtasksForProjects :many
SELECT id, project_id, title, completed, created_at, updated_at
FROM project_subtasks
WHERE project_id IN (sqlc.slice('project_ids'))
ORDER BY project_id ASC, id ASC;

-- name: GetSubtaskByIDAndProject :one
SELECT id, project_id, title, completed, created_at, updated_at
FROM project_subtasks
WHERE id = ? AND project_id = ?
LIMIT 1;

-- name: CreateSubtask :execresult
INSERT INTO project_subtasks (project_id, title, completed)
VALUES (?, ?, ?);

-- name: UpdateSubtask :execresult
UPDATE project_subtasks
SET title = ?, completed = ?
WHERE id = ? AND project_id = ?;

-- name: DeleteSubtask :execresult
DELETE FROM project_subtasks
WHERE id = ? AND project_id = ?;
