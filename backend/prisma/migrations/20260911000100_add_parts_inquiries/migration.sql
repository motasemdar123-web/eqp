-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PartsInquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'PRICED', 'QUOTED', 'PO_RECEIVED', 'CONVERTED_TO_SO', 'CLOSED_LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "parts_inquiries" (
    "id" TEXT NOT NULL,
    "inquiry_no" TEXT NOT NULL,
    "source_message_id" TEXT,
    "conversation_id" TEXT,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "company_name" TEXT,
    "subject" TEXT NOT NULL,
    "body_text" TEXT,
    "status" "PartsInquiryStatus" NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assigned_to_id" TEXT,
    "quotation_no" TEXT,
    "sap_order_no" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parts_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "parts_inquiry_items" (
    "id" TEXT NOT NULL,
    "inquiry_id" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION,
    "total_price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KWD',
    "komatsu_stock" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parts_inquiry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "parts_inquiry_attachments" (
    "id" TEXT NOT NULL,
    "inquiry_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_path" TEXT,
    "file_url" TEXT,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parts_inquiry_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "parts_inquiries_inquiry_no_key" ON "parts_inquiries"("inquiry_no");
CREATE UNIQUE INDEX IF NOT EXISTS "parts_inquiries_source_message_id_key" ON "parts_inquiries"("source_message_id");
CREATE INDEX IF NOT EXISTS "parts_inquiries_customer_email_idx" ON "parts_inquiries"("customer_email");
CREATE INDEX IF NOT EXISTS "parts_inquiries_status_idx" ON "parts_inquiries"("status");
CREATE INDEX IF NOT EXISTS "parts_inquiries_received_at_idx" ON "parts_inquiries"("received_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "parts_inquiry_items_inquiry_id_idx" ON "parts_inquiry_items"("inquiry_id");
CREATE INDEX IF NOT EXISTS "parts_inquiry_items_part_number_idx" ON "parts_inquiry_items"("part_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "parts_inquiry_attachments_inquiry_id_idx" ON "parts_inquiry_attachments"("inquiry_id");

-- AddForeignKey
ALTER TABLE "parts_inquiry_items" DROP CONSTRAINT IF EXISTS "parts_inquiry_items_inquiry_id_fkey";
ALTER TABLE "parts_inquiry_items" ADD CONSTRAINT "parts_inquiry_items_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "parts_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts_inquiry_attachments" DROP CONSTRAINT IF EXISTS "parts_inquiry_attachments_inquiry_id_fkey";
ALTER TABLE "parts_inquiry_attachments" ADD CONSTRAINT "parts_inquiry_attachments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "parts_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
