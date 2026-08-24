
INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100609',
  'PC500LC',
  '666247',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100607',
  'PC500LC',
  '666246',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100605',
  'PC500LC',
  '666230',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100603',
  'PC500LC',
  '666187',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100556',
  'PC500LC',
  '666046',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100555',
  'PC500LC',
  '666039',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100553',
  'PC500LC',
  '666033',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100536',
  'PC500LC',
  '665990',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100534',
  'PC500LC',
  '665983',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100530',
  'PC500LC',
  '665967',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100529',
  'PC500LC',
  '665966',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100525',
  'PC500LC',
  '665952',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100524',
  'PC500LC',
  '665948',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100522',
  'PC500LC',
  '665947',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '100521',
  'PC500LC',
  '665946',
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  14,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '65175',
  'WA600',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  11,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '65172',
  'WA600',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  11,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '65167',
  'WA600',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  11,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9690',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9688',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9682',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9679',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9643',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9642',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9640',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9639',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9636',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  23,
  9,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9719',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9718',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9714',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9713',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9712',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9709',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9708',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9702',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9699',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9696',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '9692',
  'HM400',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Abdally',
  NULL,
  10,
  8,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;


INSERT INTO "eqp_machines" (
  "machine_number",
  "machine_type",
  "engine_number",
  "responsible_engineer",
  "customer_name",
  "location",
  "report_template_group",
  "report_counter",
  "last_smr",
  "smr_step",
  "created_at",
  "updated_at"
) VALUES (
  '65178',
  'WA600',
  NULL,
  'Abdelrahman Abdullah',
  'Laala Al-Kuwait Real Estate Co.',
  'Sabah Al-Ahmad Sea City',
  NULL,
  27,
  11,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("machine_number") DO UPDATE SET
  "machine_type" = EXCLUDED."machine_type",
  "engine_number" = COALESCE(EXCLUDED."engine_number", "eqp_machines"."engine_number"),
  "responsible_engineer" = EXCLUDED."responsible_engineer",
  "customer_name" = EXCLUDED."customer_name",
  "location" = EXCLUDED."location",
  "report_counter" = EXCLUDED."report_counter",
  "last_smr" = EXCLUDED."last_smr",
  "updated_at" = CURRENT_TIMESTAMP;
