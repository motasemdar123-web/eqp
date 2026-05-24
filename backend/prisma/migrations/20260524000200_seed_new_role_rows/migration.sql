INSERT INTO "roles" ("id", "code", "name", "description", "created_at", "updated_at")
VALUES
  ('role-service-engineer', 'SERVICE_ENGINEER', 'Service Engineer', 'Engineer role for EQP, reports, and scheduling workflows.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role-technician', 'TECHNICIAN', 'Technician', 'Technician role for daily assigned task execution.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = CURRENT_TIMESTAMP,
  "deleted_at" = NULL;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT
  CONCAT('role-service-engineer-', LOWER("permissions"."code"::text)),
  "roles"."id",
  "permissions"."id",
  CURRENT_TIMESTAMP
FROM "roles"
JOIN "permissions" ON "permissions"."code" IN ('SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE')
WHERE "roles"."code" = 'SERVICE_ENGINEER'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at")
SELECT
  CONCAT('user-role-service-engineer-', "user_roles"."user_id"),
  "user_roles"."user_id",
  target_role."id",
  CURRENT_TIMESTAMP
FROM "user_roles"
JOIN "roles" source_role ON source_role."id" = "user_roles"."role_id"
JOIN "roles" target_role ON target_role."code" = 'SERVICE_ENGINEER'
WHERE source_role."code" = 'MAINTENANCE_SUPERVISOR'
ON CONFLICT ("user_id", "role_id") DO NOTHING;

INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at")
SELECT
  CONCAT('user-role-technician-', "user_roles"."user_id"),
  "user_roles"."user_id",
  target_role."id",
  CURRENT_TIMESTAMP
FROM "user_roles"
JOIN "roles" source_role ON source_role."id" = "user_roles"."role_id"
JOIN "roles" target_role ON target_role."code" = 'TECHNICIAN'
WHERE source_role."code" = 'FIELD_TECHNICIAN'
ON CONFLICT ("user_id", "role_id") DO NOTHING;
