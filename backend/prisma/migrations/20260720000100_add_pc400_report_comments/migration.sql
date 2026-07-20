INSERT INTO "eqp_report_comments" ("machine_model", "document_type", "service_stage", "comment_text", "frequency", "updated_at")
VALUES
  ('PC400', 'new_machine', 'pre_delivery', 'Pre-delivery inspection completed; excavator delivery readiness confirmed.', 3, CURRENT_TIMESTAMP),
  ('PC400', 'new_machine', 'pre_delivery', 'Boom, arm, bucket, undercarriage, hydraulic areas, and visible condition checked before handover.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'new_machine', 'pre_delivery', 'Cab controls, monitor panel, travel alarm, lights, horn, and safety lock lever checked.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'new_machine', 'pre_delivery', 'Fluid levels, battery condition, attachment pins, and visible leaks checked before delivery.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'new_machine', 'delivery', 'New excavator delivery inspection completed and customer handover condition confirmed.', 3, CURRENT_TIMESTAMP),
  ('PC400', 'new_machine', 'delivery', 'Machine details, serial number, service meter reading, and delivery condition verified.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'new_machine', 'delivery', 'Travel, swing, boom, arm, bucket, monitor, and safety controls checked during delivery.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'new_machine', 'delivery', 'Excavator handed over with no critical leakage, warning indication, or external damage observed.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'delivery', 'Used excavator delivery inspection completed with operating condition and SMR recorded.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'delivery', 'Customer site handover completed after checking hydraulic, undercarriage, attachment, and safety items.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'delivery', 'Travel, swing, work equipment operation, visible leaks, and warning indicators checked at handover.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'scheduled_service', 'Scheduled service completed; engine, hydraulic, swing, travel, and safety systems checked.', 3, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'scheduled_service', 'Boom, arm, bucket, pins, bushings, cylinders, and attachment condition inspected.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'scheduled_service', 'Track tension, shoes, links, rollers, idlers, sprockets, and final drives inspected.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'scheduled_service', 'Fluid levels, filters, cooling system, lubrication points, and visible leaks checked.', 3, CURRENT_TIMESTAMP),
  ('PC400', 'in_operation', 'scheduled_service', 'Monitor panel, warning indicators, travel alarm, horn, lights, and control levers checked.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'storage', 'storage_service', 'Storage service completed; excavator preservation condition and visible leaks checked.', 3, CURRENT_TIMESTAMP),
  ('PC400', 'storage', 'storage_service', 'Battery, fluid levels, undercarriage, attachment, and exposed hydraulic components reviewed in storage.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'storage', 'storage_service', 'Boom, arm, bucket, cylinder rods, hoses, and external protection inspected during storage service.', 2, CURRENT_TIMESTAMP),
  ('PC400', 'storage', 'storage_service', 'Machine remains parked under storage condition; preservation checks completed.', 2, CURRENT_TIMESTAMP)
ON CONFLICT ("machine_model", "document_type", "service_stage", "comment_text") DO UPDATE
  SET "frequency" = GREATEST("eqp_report_comments"."frequency", EXCLUDED."frequency"),
      "is_active" = true,
      "updated_at" = CURRENT_TIMESTAMP;
