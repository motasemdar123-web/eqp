-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Legacy EQP compatibility:
-- Existing deployments may already have a legacy "users" table with numeric ids.
-- Rename it before creating the platform users table, then copy technician codes back
-- into the new canonical "users" table at the end of this migration.
DO $$
DECLARE
  legacy_index record;
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = 'id'
         AND data_type IN ('integer', 'bigint')
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = 'email'
     )
  THEN
    IF to_regclass('public.legacy_eqp_users') IS NULL THEN
      ALTER TABLE public.users RENAME TO legacy_eqp_users;
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.legacy_eqp_users'::regclass
          AND conname = 'users_pkey'
      ) THEN
        ALTER TABLE public.legacy_eqp_users RENAME CONSTRAINT users_pkey TO legacy_eqp_users_pkey;
      END IF;

      FOR legacy_index IN
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'legacy_eqp_users'
          AND indexname LIKE 'users_%'
      LOOP
        EXECUTE format(
          'ALTER INDEX public.%I RENAME TO %I',
          legacy_index.indexname,
          'legacy_eqp_' || legacy_index.indexname
        );
      END LOOP;
    ELSE
      RAISE EXCEPTION 'Cannot migrate: both legacy users and legacy_eqp_users exist.';
    END IF;
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'INVITED');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SUPER_ADMIN', 'GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'MAINTENANCE_SUPERVISOR', 'FIELD_TECHNICIAN', 'CALL_CENTER', 'WAREHOUSE_OFFICER', 'FINANCE', 'CLIENT', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "PermissionCode" AS ENUM ('USERS_MANAGE', 'REQUESTS_CREATE', 'REQUESTS_READ', 'REQUESTS_ASSIGN', 'REQUESTS_APPROVE', 'WORK_ORDERS_MANAGE', 'WORK_ORDERS_CLOSE', 'ASSETS_MANAGE', 'INVENTORY_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'SYSTEM_CONFIGURE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'REOPENED', 'CANCELLED', 'MERGED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'PENDING_APPROVAL', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP', 'PORTAL', 'TECHNICIAN', 'PREVENTIVE_MAINTENANCE', 'MANAGEMENT');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'RETIRED', 'LOST');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('ISSUE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'PURCHASE_RECEIPT', 'RESERVATION');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "AttachmentOwnerType" AS ENUM ('REQUEST', 'WORK_ORDER', 'ASSET', 'EQP_REPORT', 'COMMENT');

-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('INTERNAL', 'CUSTOMER', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "ChecklistOwnerType" AS ENUM ('WORK_ORDER', 'PREVENTIVE_MAINTENANCE', 'ASSET');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "SlaTargetType" AS ENUM ('RESPONSE', 'RESOLUTION');

-- CreateEnum
CREATE TYPE "CustomFieldEntity" AS ENUM ('REQUEST', 'WORK_ORDER', 'ASSET', 'CLIENT', 'BRANCH', 'LOCATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_number" INTEGER,
    "full_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "client_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" "PermissionCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before_data" JSONB,
    "after_data" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "contacts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "branch_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT,
    "property_id" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "floor" TEXT,
    "unit" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "asset_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serial_number" TEXT,
    "branch_id" TEXT,
    "property_id" TEXT,
    "location_id" TEXT,
    "category_id" TEXT,
    "warranty_until" TIMESTAMP(3),
    "purchase_date" TIMESTAMP(3),
    "lifecycle_status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "accumulated_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "source" "RequestSource" NOT NULL DEFAULT 'PORTAL',
    "sla_target_at" TIMESTAMP(3),
    "branch_id" TEXT,
    "location_id" TEXT,
    "asset_id" TEXT,
    "created_by_user_id" TEXT,
    "customer_visible_notes" TEXT,
    "internal_notes" TEXT,
    "duplicate_of_id" TEXT,
    "recurring_group_id" TEXT,
    "reopen_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "work_order_number" TEXT NOT NULL,
    "request_id" TEXT,
    "asset_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "scheduled_start_at" TIMESTAMP(3),
    "scheduled_end_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "closure_notes" TEXT,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_assignments" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "work_order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_code" TEXT,
    "region" TEXT,
    "shift_id" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "technician_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_skills" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "level" TEXT,
    "certificate_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "technician_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preventive_maintenance_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asset_id" TEXT,
    "frequency" "Frequency" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "preventive_maintenance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preventive_maintenance_schedules" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "generated_work_order_id" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "preventive_maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_threshold" INTEGER NOT NULL DEFAULT 0,
    "average_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(65,30),
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "target_type" "SlaTargetType" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sla_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "owner_type" "AttachmentOwnerType" NOT NULL,
    "owner_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT,
    "work_order_id" TEXT,
    "visibility" "CommentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "owner_type" "ChecklistOwnerType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "internal_key" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_responses" (
    "id" TEXT NOT NULL,
    "checklist_item_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "value" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "checklist_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_timelines" (
    "id" TEXT NOT NULL,
    "request_id" TEXT,
    "work_order_id" TEXT,
    "event_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "activity_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_attendance" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "technician_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_performance_metrics" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "completed_work_orders" INTEGER NOT NULL DEFAULT 0,
    "average_resolution_minutes" INTEGER NOT NULL DEFAULT 0,
    "sla_compliance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "technician_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_assets" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "qr_value" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "qr_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "asset_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "entity" "CustomFieldEntity" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "label_ar" TEXT,
    "field_type" TEXT NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eqp_machines" (
    "id" SERIAL NOT NULL,
    "machine_number" TEXT NOT NULL,
    "engine_number" TEXT,
    "machine_type" TEXT,
    "last_smr" INTEGER NOT NULL DEFAULT 0,
    "smr_step" INTEGER NOT NULL DEFAULT 0,
    "report_counter" INTEGER NOT NULL DEFAULT 0,
    "responsible_engineer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "eqp_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eqp_reports" (
    "id" SERIAL NOT NULL,
    "report_no" TEXT NOT NULL,
    "machine_type" TEXT,
    "machine_id" INTEGER,
    "engine_number" TEXT,
    "smr" INTEGER,
    "service_date" TIMESTAMP(3),
    "comments" TEXT,
    "created_by" TEXT,
    "machine_number" TEXT,
    "report_type" TEXT,
    "service_type" TEXT,
    "file_name" TEXT,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_user" TEXT,
    "updated_by_user" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "eqp_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eqp_machine_history" (
    "id" SERIAL NOT NULL,
    "machine_id" INTEGER,
    "operation_type" TEXT,
    "report_type" TEXT,
    "service_type" TEXT,
    "smr" INTEGER,
    "performed_by" TEXT,
    "operation_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "eqp_machine_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eqp_report_comments" (
    "id" SERIAL NOT NULL,
    "comment_text" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "eqp_report_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_number_key" ON "users"("user_number");

-- CreateIndex
CREATE INDEX "users_client_id_idx" ON "users"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE INDEX "branches_client_id_idx" ON "branches"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "properties_code_key" ON "properties"("code");

-- CreateIndex
CREATE INDEX "properties_client_id_idx" ON "properties"("client_id");

-- CreateIndex
CREATE INDEX "properties_branch_id_idx" ON "properties"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE INDEX "locations_branch_id_idx" ON "locations"("branch_id");

-- CreateIndex
CREATE INDEX "locations_property_id_idx" ON "locations"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_code_key" ON "asset_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_code_key" ON "assets"("asset_code");

-- CreateIndex
CREATE INDEX "assets_branch_id_idx" ON "assets"("branch_id");

-- CreateIndex
CREATE INDEX "assets_location_id_idx" ON "assets"("location_id");

-- CreateIndex
CREATE INDEX "assets_category_id_idx" ON "assets"("category_id");

-- CreateIndex
CREATE INDEX "assets_lifecycle_status_idx" ON "assets"("lifecycle_status");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_requests_request_number_key" ON "maintenance_requests"("request_number");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests"("status");

-- CreateIndex
CREATE INDEX "maintenance_requests_priority_idx" ON "maintenance_requests"("priority");

-- CreateIndex
CREATE INDEX "maintenance_requests_branch_id_idx" ON "maintenance_requests"("branch_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_asset_id_idx" ON "maintenance_requests"("asset_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_sla_target_at_idx" ON "maintenance_requests"("sla_target_at");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_work_order_number_key" ON "work_orders"("work_order_number");

-- CreateIndex
CREATE INDEX "work_orders_request_id_idx" ON "work_orders"("request_id");

-- CreateIndex
CREATE INDEX "work_orders_asset_id_idx" ON "work_orders"("asset_id");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_scheduled_start_at_idx" ON "work_orders"("scheduled_start_at");

-- CreateIndex
CREATE INDEX "work_order_assignments_technician_id_idx" ON "work_order_assignments"("technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_assignments_work_order_id_technician_id_key" ON "work_order_assignments"("work_order_id", "technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "technician_profiles_user_id_key" ON "technician_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "technician_profiles_employee_code_key" ON "technician_profiles"("employee_code");

-- CreateIndex
CREATE INDEX "technician_profiles_shift_id_idx" ON "technician_profiles"("shift_id");

-- CreateIndex
CREATE INDEX "technician_skills_skill_idx" ON "technician_skills"("skill");

-- CreateIndex
CREATE UNIQUE INDEX "technician_skills_technician_id_skill_key" ON "technician_skills"("technician_id", "skill");

-- CreateIndex
CREATE INDEX "preventive_maintenance_plans_asset_id_idx" ON "preventive_maintenance_plans"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "preventive_maintenance_plans_asset_id_name_key" ON "preventive_maintenance_plans"("asset_id", "name");

-- CreateIndex
CREATE INDEX "preventive_maintenance_schedules_due_at_idx" ON "preventive_maintenance_schedules"("due_at");

-- CreateIndex
CREATE INDEX "preventive_maintenance_schedules_plan_id_idx" ON "preventive_maintenance_schedules"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "preventive_maintenance_schedules_plan_id_due_at_key" ON "preventive_maintenance_schedules"("plan_id", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_supplier_id_idx" ON "inventory_items"("supplier_id");

-- CreateIndex
CREATE INDEX "stock_movements_item_id_idx" ON "stock_movements"("item_id");

-- CreateIndex
CREATE INDEX "stock_movements_work_order_id_idx" ON "stock_movements"("work_order_id");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_item_id_reference_key" ON "stock_movements"("item_id", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_request_number_key" ON "purchase_requests"("request_number");

-- CreateIndex
CREATE INDEX "purchase_requests_item_id_idx" ON "purchase_requests"("item_id");

-- CreateIndex
CREATE INDEX "purchase_requests_supplier_id_idx" ON "purchase_requests"("supplier_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sla_configs_priority_target_type_key" ON "sla_configs"("priority", "target_type");

-- CreateIndex
CREATE INDEX "attachments_owner_type_owner_id_idx" ON "attachments"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "comments_request_id_idx" ON "comments"("request_id");

-- CreateIndex
CREATE INDEX "comments_work_order_id_idx" ON "comments"("work_order_id");

-- CreateIndex
CREATE INDEX "checklist_items_checklist_id_idx" ON "checklist_items"("checklist_id");

-- CreateIndex
CREATE INDEX "checklist_responses_work_order_id_idx" ON "checklist_responses"("work_order_id");

-- CreateIndex
CREATE INDEX "checklist_responses_checklist_item_id_idx" ON "checklist_responses"("checklist_item_id");

-- CreateIndex
CREATE INDEX "activity_timelines_request_id_idx" ON "activity_timelines"("request_id");

-- CreateIndex
CREATE INDEX "activity_timelines_work_order_id_idx" ON "activity_timelines"("work_order_id");

-- CreateIndex
CREATE INDEX "activity_timelines_created_at_idx" ON "activity_timelines"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "holidays_branch_id_date_idx" ON "holidays"("branch_id", "date");

-- CreateIndex
CREATE INDEX "shifts_branch_id_idx" ON "shifts"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_branch_id_name_key" ON "shifts"("branch_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "technician_attendance_technician_id_date_key" ON "technician_attendance"("technician_id", "date");

-- CreateIndex
CREATE INDEX "technician_performance_metrics_technician_id_period_start_idx" ON "technician_performance_metrics"("technician_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "qr_assets_asset_id_key" ON "qr_assets"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "qr_assets_qr_value_key" ON "qr_assets"("qr_value");

-- CreateIndex
CREATE INDEX "tags_asset_id_idx" ON "tags"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_entity_key_key" ON "custom_fields"("entity", "key");

-- CreateIndex
CREATE UNIQUE INDEX "eqp_machines_machine_number_key" ON "eqp_machines"("machine_number");

-- CreateIndex
CREATE INDEX "eqp_machines_machine_type_idx" ON "eqp_machines"("machine_type");

-- CreateIndex
CREATE UNIQUE INDEX "eqp_reports_report_no_key" ON "eqp_reports"("report_no");

-- CreateIndex
CREATE INDEX "eqp_reports_machine_id_idx" ON "eqp_reports"("machine_id");

-- CreateIndex
CREATE INDEX "eqp_reports_created_at_idx" ON "eqp_reports"("created_at");

-- CreateIndex
CREATE INDEX "eqp_reports_service_type_idx" ON "eqp_reports"("service_type");

-- CreateIndex
CREATE INDEX "eqp_machine_history_machine_id_idx" ON "eqp_machine_history"("machine_id");

-- CreateIndex
CREATE INDEX "eqp_machine_history_created_at_idx" ON "eqp_machine_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "eqp_report_comments_comment_text_key" ON "eqp_report_comments"("comment_text");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "maintenance_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_profiles" ADD CONSTRAINT "technician_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_profiles" ADD CONSTRAINT "technician_profiles_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_skills" ADD CONSTRAINT "technician_skills_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_maintenance_plans" ADD CONSTRAINT "preventive_maintenance_plans_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_maintenance_schedules" ADD CONSTRAINT "preventive_maintenance_schedules_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "preventive_maintenance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_checklist_item_id_fkey" FOREIGN KEY ("checklist_item_id") REFERENCES "checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_timelines" ADD CONSTRAINT "activity_timelines_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_timelines" ADD CONSTRAINT "activity_timelines_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_attendance" ADD CONSTRAINT "technician_attendance_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_performance_metrics" ADD CONSTRAINT "technician_performance_metrics_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_assets" ADD CONSTRAINT "qr_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eqp_reports" ADD CONSTRAINT "eqp_reports_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "eqp_machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eqp_machine_history" ADD CONSTRAINT "eqp_machine_history_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "eqp_machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Copy data from the legacy EQP tables when this migration is applied to an
-- existing EQP deployment. Fresh databases simply skip these blocks.
DO $$
BEGIN
  IF to_regclass('public.legacy_eqp_users') IS NOT NULL THEN
    INSERT INTO public.users (
      id,
      email,
      user_number,
      full_name,
      password_hash,
      locale,
      status,
      created_at,
      updated_at
    )
    SELECT
      lower(md5('legacy-eqp-user:' || id::text)),
      'legacy.user.' || user_number::text || '@daralhai.local',
      user_number,
      COALESCE(NULLIF(full_name, ''), NULLIF(trim(concat_ws(' ', first_name, last_name)), ''), 'Legacy EQP User ' || user_number::text),
      '$2b$12$7j.U4Ck2BUPboYaxqa1Ec..crziknpMECOn3aLHsGpwzm0KF3ZOVa',
      'ar',
      'ACTIVE'::"UserStatus",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM public.legacy_eqp_users
    ON CONFLICT (user_number) DO NOTHING;
  END IF;
END $$;

DO $$
DECLARE
  max_id integer;
BEGIN
  IF to_regclass('public.machines') IS NOT NULL THEN
    INSERT INTO public.eqp_machines (
      id,
      machine_number,
      engine_number,
      machine_type,
      last_smr,
      smr_step,
      report_counter,
      responsible_engineer,
      created_at,
      updated_at
    )
    SELECT
      id::integer,
      machine_number::text,
      engine_number::text,
      machine_type,
      COALESCE(last_smr, 0)::integer,
      COALESCE(smr_step, 0)::integer,
      COALESCE(report_counter, 0)::integer,
      responsible_engineer,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM public.machines
    WHERE id BETWEEN 1 AND 2147483647
    ON CONFLICT (machine_number) DO NOTHING;

    SELECT MAX(id) INTO max_id FROM public.eqp_machines;
    PERFORM setval(pg_get_serial_sequence('public.eqp_machines', 'id'), COALESCE(max_id, 1), max_id IS NOT NULL);
  END IF;
END $$;

DO $$
DECLARE
  max_id integer;
BEGIN
  IF to_regclass('public.reports') IS NOT NULL THEN
    INSERT INTO public.eqp_reports (
      id,
      report_no,
      machine_type,
      machine_id,
      engine_number,
      smr,
      service_date,
      comments,
      created_by,
      machine_number,
      report_type,
      service_type,
      file_name,
      file_url,
      created_at,
      updated_at
    )
    SELECT
      r.id::integer,
      r.report_no,
      r.machine_type,
      CASE
        WHEN r.machine_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.eqp_machines em WHERE em.id = r.machine_id::integer
        )
        THEN r.machine_id::integer
        ELSE NULL
      END,
      r.engine_number::text,
      r.smr,
      r.service_date,
      r.comments,
      r.created_by,
      r.machine_number,
      r.report_type,
      r.service_type,
      r.file_name,
      r.file_url,
      COALESCE(r.created_at, CURRENT_TIMESTAMP),
      COALESCE(r.created_at, CURRENT_TIMESTAMP)
    FROM public.reports r
    WHERE r.report_no IS NOT NULL
      AND r.id BETWEEN 1 AND 2147483647
    ON CONFLICT (report_no) DO NOTHING;

    SELECT MAX(id) INTO max_id FROM public.eqp_reports;
    PERFORM setval(pg_get_serial_sequence('public.eqp_reports', 'id'), COALESCE(max_id, 1), max_id IS NOT NULL);
  END IF;
END $$;

DO $$
DECLARE
  max_id integer;
BEGIN
  IF to_regclass('public.machine_history') IS NOT NULL THEN
    INSERT INTO public.eqp_machine_history (
      id,
      machine_id,
      operation_type,
      smr,
      performed_by,
      operation_date,
      created_at,
      updated_at
    )
    SELECT
      mh.id::integer,
      CASE
        WHEN mh.machine_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.eqp_machines em WHERE em.id = mh.machine_id::integer
        )
        THEN mh.machine_id::integer
        ELSE NULL
      END,
      mh.operation_type,
      mh.smr,
      mh.performed_by,
      mh.operation_date,
      COALESCE(mh.created_at, CURRENT_TIMESTAMP),
      COALESCE(mh.created_at, CURRENT_TIMESTAMP)
    FROM public.machine_history mh
    WHERE mh.id BETWEEN 1 AND 2147483647
    ON CONFLICT (id) DO NOTHING;

    SELECT MAX(id) INTO max_id FROM public.eqp_machine_history;
    PERFORM setval(pg_get_serial_sequence('public.eqp_machine_history', 'id'), COALESCE(max_id, 1), max_id IS NOT NULL);
  END IF;
END $$;

DO $$
DECLARE
  max_id integer;
BEGIN
  IF to_regclass('public.report_comments') IS NOT NULL THEN
    INSERT INTO public.eqp_report_comments (
      id,
      comment_text,
      frequency,
      created_at,
      updated_at
    )
    SELECT
      id::integer,
      comment_text,
      COALESCE(frequency, 1),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM public.report_comments
    WHERE comment_text IS NOT NULL
      AND id BETWEEN 1 AND 2147483647
    ON CONFLICT (comment_text) DO UPDATE
      SET frequency = GREATEST(public.eqp_report_comments.frequency, EXCLUDED.frequency),
          updated_at = CURRENT_TIMESTAMP;

    SELECT MAX(id) INTO max_id FROM public.eqp_report_comments;
    PERFORM setval(pg_get_serial_sequence('public.eqp_report_comments', 'id'), COALESCE(max_id, 1), max_id IS NOT NULL);
  END IF;
END $$;

