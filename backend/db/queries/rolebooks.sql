-- name: GetRolebookByOwner :one
SELECT id, owner_id, role_title, created_at, updated_at
FROM rolebooks
WHERE owner_id = ?
LIMIT 1;

-- name: CreateRolebook :execresult
INSERT INTO rolebooks (owner_id, role_title)
VALUES (?, ?);

-- name: UpdateRolebookByOwner :execresult
UPDATE rolebooks
SET role_title = sqlc.arg(role_title)
WHERE owner_id = sqlc.arg(owner_id);

-- name: TransferRolebookOwnership :execresult
UPDATE rolebooks
SET owner_id = sqlc.arg(new_owner_id)
WHERE owner_id = sqlc.arg(old_owner_id);
