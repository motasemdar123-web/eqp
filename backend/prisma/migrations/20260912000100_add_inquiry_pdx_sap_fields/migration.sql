-- AlterTable
ALTER TABLE "parts_inquiries" 
  ADD COLUMN IF NOT EXISTS "recipient_email" TEXT,
  ADD COLUMN IF NOT EXISTS "assigned_to_name" TEXT DEFAULT 'Motasem Ghanem',
  ADD COLUMN IF NOT EXISTS "customer_code" TEXT,
  ADD COLUMN IF NOT EXISTS "markup_percentage" DOUBLE PRECISION DEFAULT 15.0;

CREATE INDEX IF NOT EXISTS "parts_inquiries_assigned_to_name_idx" ON "parts_inquiries"("assigned_to_name");

-- AlterTable
ALTER TABLE "parts_inquiry_items" 
  ADD COLUMN IF NOT EXISTS "cost_price" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "selling_price" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "compatible_models" TEXT;
