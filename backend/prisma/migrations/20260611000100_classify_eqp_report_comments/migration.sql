ALTER TABLE "eqp_report_comments"
  ADD COLUMN IF NOT EXISTS "machine_model" TEXT NOT NULL DEFAULT 'D155A',
  ADD COLUMN IF NOT EXISTS "document_type" TEXT NOT NULL DEFAULT 'in_operation',
  ADD COLUMN IF NOT EXISTS "service_stage" TEXT NOT NULL DEFAULT 'scheduled_service',
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "eqp_report_comments_comment_text_key";

CREATE UNIQUE INDEX IF NOT EXISTS "eqp_report_comments_machine_model_document_type_service_stage_comment_text_key"
  ON "eqp_report_comments"("machine_model", "document_type", "service_stage", "comment_text");

CREATE INDEX IF NOT EXISTS "eqp_report_comments_machine_model_document_type_service_stage_is_active_idx"
  ON "eqp_report_comments"("machine_model", "document_type", "service_stage", "is_active");

INSERT INTO "eqp_report_comments" ("machine_model", "document_type", "service_stage", "comment_text", "frequency", "updated_at")
VALUES
  ('D155A', 'new_machine', 'pre_delivery', 'Pre-delivery inspection completed before dozer handover.', 3, CURRENT_TIMESTAMP),
  ('D155A', 'new_machine', 'pre_delivery', 'Machine prepared for delivery; no operation-related defects observed.', 2, CURRENT_TIMESTAMP),
  ('D155A', 'new_machine', 'pre_delivery', 'Dozer visual inspection and delivery readiness checks completed.', 2, CURRENT_TIMESTAMP),
  ('D155A', 'new_machine', 'delivery', 'New dozer delivery inspection completed and handover condition confirmed.', 3, CURRENT_TIMESTAMP),
  ('D155A', 'new_machine', 'delivery', 'Customer delivery checks completed with machine details verified.', 2, CURRENT_TIMESTAMP),
  ('D155A', 'in_operation', 'delivery', 'Used dozer delivery inspection completed and operating condition recorded.', 2, CURRENT_TIMESTAMP),
  ('D155A', 'in_operation', 'delivery', 'Machine handover completed after checking visible leaks, damage, and service condition.', 2, CURRENT_TIMESTAMP),
  ('D155A', 'in_operation', 'scheduled_service', 'Preventive maintenance completed successfully.', 3, CURRENT_TIMESTAMP),
  ('D155A', 'in_operation', 'scheduled_service', 'Undercarriage, blade, ripper, hydraulic, and engine areas inspected.', 2, CURRENT_TIMESTAMP),
  ('D155A', 'in_operation', 'scheduled_service', 'No abnormal noise or leakage observed during service inspection.', 1, CURRENT_TIMESTAMP),
  ('D155A', 'storage', 'storage_service', 'Storage service completed; machine preservation condition checked.', 3, CURRENT_TIMESTAMP),
  ('D155A', 'storage', 'storage_service', 'Fluids, visible leaks, battery condition, and external protection checked during storage service.', 2, CURRENT_TIMESTAMP),
  ('D155A', 'storage', 'storage_service', 'Dozer storage readiness confirmed and preservation items reviewed.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'new_machine', 'pre_delivery', 'Pre-delivery inspection completed before dump truck handover.', 3, CURRENT_TIMESTAMP),
  ('HM400', 'new_machine', 'pre_delivery', 'Dump truck prepared for delivery; no operation-related defects observed.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'new_machine', 'pre_delivery', 'Truck visual inspection and delivery readiness checks completed.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'new_machine', 'delivery', 'New dump truck delivery inspection completed and handover condition confirmed.', 3, CURRENT_TIMESTAMP),
  ('HM400', 'new_machine', 'delivery', 'Customer delivery checks completed with truck details verified.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'in_operation', 'delivery', 'Used dump truck delivery inspection completed and operating condition recorded.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'in_operation', 'delivery', 'Truck handover completed after checking visible leaks, damage, tires, and service condition.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'in_operation', 'scheduled_service', 'Preventive maintenance completed successfully for dump truck service items.', 3, CURRENT_TIMESTAMP),
  ('HM400', 'in_operation', 'scheduled_service', 'Dump body, hoist cylinders, articulation joint, brakes, retarder, and tires inspected.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'in_operation', 'scheduled_service', 'No abnormal noise, leakage, or warning indicators observed during inspection.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'storage', 'storage_service', 'Storage service completed; dump truck preservation condition checked.', 3, CURRENT_TIMESTAMP),
  ('HM400', 'storage', 'storage_service', 'Tires, hydraulic areas, battery condition, and visible leaks checked during storage service.', 2, CURRENT_TIMESTAMP),
  ('HM400', 'storage', 'storage_service', 'Dump truck storage readiness confirmed and preservation items reviewed.', 2, CURRENT_TIMESTAMP)
ON CONFLICT ("machine_model", "document_type", "service_stage", "comment_text") DO UPDATE
  SET "frequency" = GREATEST("eqp_report_comments"."frequency", EXCLUDED."frequency"),
      "is_active" = true,
      "updated_at" = CURRENT_TIMESTAMP;
