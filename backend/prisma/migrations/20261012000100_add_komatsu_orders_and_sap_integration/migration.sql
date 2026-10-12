-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "KomatsuOrderChannel" AS ENUM ('EMERGENCY_ORDER', 'DAILY_STOCK', 'STOCK_ORDER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SapIntegrationStatus" AS ENUM ('PENDING_SAP_PULL', 'PULLED_BY_SAP', 'SAP_PO_CREATED', 'SAP_SYNC_FAILED', 'EXCLUDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KomatsuAuditAction" AS ENUM ('SYNC_CREATED', 'SYNC_UPDATED', 'STATUS_CHANGED', 'SAP_PULLED', 'SAP_ACKNOWLEDGED', 'SAP_FAILED', 'MANUAL_EDIT', 'RETRY_QUEUED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KomatsuSyncTrigger" AS ENUM ('SCHEDULED_CRON', 'MANUAL_USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KomatsuSyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'AUTH_EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable komatsu_orders
CREATE TABLE IF NOT EXISTS "komatsu_orders" (
    "id" TEXT NOT NULL,
    "komatsu_sales_order_no" TEXT,
    "komatsu_quotation_no" TEXT,
    "distributor_ref_no" TEXT,
    "channel" "KomatsuOrderChannel" NOT NULL DEFAULT 'EMERGENCY_ORDER',
    "order_date" TIMESTAMP(3),
    "delivery_due_date" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "vendor_code" TEXT NOT NULL DEFAULT 'V000006',
    "equipment_serial" TEXT,
    "equipment_model" TEXT,
    "customer_code" TEXT,
    "customer_name" TEXT,
    "comments" TEXT,
    "remarks" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sap_status" "SapIntegrationStatus" NOT NULL DEFAULT 'PENDING_SAP_PULL',
    "sap_doc_num" TEXT,
    "sap_doc_entry" INTEGER,
    "sap_synced_at" TIMESTAMP(3),
    "sap_failure_reason" TEXT,
    "sync_job_id" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "komatsu_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable komatsu_order_items
CREATE TABLE IF NOT EXISTS "komatsu_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL DEFAULT 1,
    "part_number" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "line_total_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "suggested_warehouse" TEXT NOT NULL DEFAULT '003',
    "suggested_tax_code" TEXT NOT NULL DEFAULT 'P0',
    "raw_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "komatsu_order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "komatsu_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "komatsu_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable komatsu_order_audit_logs
CREATE TABLE IF NOT EXISTS "komatsu_order_audit_logs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "action" "KomatsuAuditAction" NOT NULL DEFAULT 'STATUS_CHANGED',
    "actor_type" TEXT NOT NULL DEFAULT 'SYSTEM_CRON',
    "actor_id" TEXT,
    "actor_name" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "komatsu_order_audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "komatsu_order_audit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "komatsu_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable komatsu_sync_jobs
CREATE TABLE IF NOT EXISTS "komatsu_sync_jobs" (
    "id" TEXT NOT NULL,
    "trigger_type" "KomatsuSyncTrigger" NOT NULL DEFAULT 'SCHEDULED_CRON',
    "status" "KomatsuSyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "orders_found" INTEGER NOT NULL DEFAULT 0,
    "orders_inserted" INTEGER NOT NULL DEFAULT 0,
    "orders_updated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "triggered_by_id" TEXT,
    "triggered_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "komatsu_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable api_keys
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['sap:read', 'sap:write']::TEXT[],
    "allowed_ips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "role" TEXT NOT NULL DEFAULT 'SAP_INTEGRATION_SERVICE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable api_access_logs
CREATE TABLE IF NOT EXISTS "api_access_logs" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "http_method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "response_time_ms" INTEGER,
    "request_payload" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "api_access_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indices
CREATE UNIQUE INDEX IF NOT EXISTS "komatsu_orders_komatsu_sales_order_no_key" ON "komatsu_orders"("komatsu_sales_order_no");
CREATE INDEX IF NOT EXISTS "komatsu_orders_sap_status_idx" ON "komatsu_orders"("sap_status");
CREATE INDEX IF NOT EXISTS "komatsu_orders_komatsu_quotation_no_idx" ON "komatsu_orders"("komatsu_quotation_no");
CREATE INDEX IF NOT EXISTS "komatsu_orders_distributor_ref_no_idx" ON "komatsu_orders"("distributor_ref_no");
CREATE INDEX IF NOT EXISTS "komatsu_orders_order_date_idx" ON "komatsu_orders"("order_date");

CREATE INDEX IF NOT EXISTS "komatsu_order_items_order_id_idx" ON "komatsu_order_items"("order_id");
CREATE INDEX IF NOT EXISTS "komatsu_order_items_part_number_idx" ON "komatsu_order_items"("part_number");

CREATE INDEX IF NOT EXISTS "komatsu_order_audit_logs_order_id_idx" ON "komatsu_order_audit_logs"("order_id");
CREATE INDEX IF NOT EXISTS "komatsu_order_audit_logs_created_at_idx" ON "komatsu_order_audit_logs"("created_at");

CREATE INDEX IF NOT EXISTS "komatsu_sync_jobs_status_idx" ON "komatsu_sync_jobs"("status");
CREATE INDEX IF NOT EXISTS "komatsu_sync_jobs_started_at_idx" ON "komatsu_sync_jobs"("started_at");

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_key_hash_idx" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_is_active_idx" ON "api_keys"("is_active");

CREATE INDEX IF NOT EXISTS "api_access_logs_api_key_id_idx" ON "api_access_logs"("api_key_id");
CREATE INDEX IF NOT EXISTS "api_access_logs_endpoint_idx" ON "api_access_logs"("endpoint");
CREATE INDEX IF NOT EXISTS "api_access_logs_created_at_idx" ON "api_access_logs"("created_at");
