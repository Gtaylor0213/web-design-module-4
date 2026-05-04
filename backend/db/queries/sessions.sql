-- name: CreateSession :execresult
INSERT INTO sessions (user_id, token, expires_at)
VALUES (?, ?, ?);

-- name: GetSessionByToken :one
SELECT id, user_id, token, expires_at, created_at
FROM sessions
WHERE token = ?
  AND expires_at > NOW()
LIMIT 1;

-- name: DeleteSessionByToken :exec
DELETE FROM sessions
WHERE token = ?;
