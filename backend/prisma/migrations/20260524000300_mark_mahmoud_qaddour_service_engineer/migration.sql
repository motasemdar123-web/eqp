INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at")
SELECT
  CONCAT('user-role-service-engineer-mahmoud-qaddour-', "users"."id"),
  "users"."id",
  "roles"."id",
  CURRENT_TIMESTAMP
FROM "users"
JOIN "roles" ON "roles"."code" = 'SERVICE_ENGINEER'
WHERE LOWER("users"."full_name") LIKE '%mahmoud%'
  AND LOWER("users"."full_name") LIKE '%qaddour%'
  AND "users"."deleted_at" IS NULL
ON CONFLICT ("user_id", "role_id") DO NOTHING;

DELETE FROM "user_roles"
USING "users", "roles"
WHERE "user_roles"."user_id" = "users"."id"
  AND "user_roles"."role_id" = "roles"."id"
  AND "roles"."code" IN ('TECHNICIAN', 'FIELD_TECHNICIAN', 'MAINTENANCE_SUPERVISOR')
  AND LOWER("users"."full_name") LIKE '%mahmoud%'
  AND LOWER("users"."full_name") LIKE '%qaddour%'
  AND "users"."deleted_at" IS NULL;

UPDATE "technician_profiles"
SET
  "is_available" = FALSE,
  "deleted_at" = COALESCE("deleted_at", CURRENT_TIMESTAMP),
  "updated_at" = CURRENT_TIMESTAMP
WHERE "user_id" IN (
  SELECT "id"
  FROM "users"
  WHERE LOWER("full_name") LIKE '%mahmoud%'
    AND LOWER("full_name") LIKE '%qaddour%'
    AND "deleted_at" IS NULL
);
