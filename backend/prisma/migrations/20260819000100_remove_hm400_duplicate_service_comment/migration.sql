DELETE FROM "eqp_report_comments"
WHERE "machine_model" = 'HM400'
  AND "document_type" = 'in_operation'
  AND "service_stage" = 'scheduled_service'
  AND "comment_text" = 'Preventive maintenance completed successfully for dump truck service items.';
