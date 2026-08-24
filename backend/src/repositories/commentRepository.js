const db = require('../config/database');
const { resolveEqpTable } = require('./eqpTableResolver');

async function findAll(filters = {}) {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');
  const conditions = [];
  const params = [];

  if (filters.machineModel && filters.machineModel !== 'ALL') {
    params.push(filters.machineModel);
    conditions.push(`machine_model = $${params.length}`);
  }

  if (filters.documentType && filters.documentType !== 'ALL') {
    params.push(filters.documentType);
    conditions.push(`document_type = $${params.length}`);
  }

  if (filters.serviceStage && filters.serviceStage !== 'ALL') {
    params.push(filters.serviceStage);
    conditions.push(`service_stage = $${params.length}`);
  }

  if (filters.isActive !== undefined && filters.isActive !== null && filters.isActive !== 'ALL') {
    params.push(filters.isActive === true || filters.isActive === 'true');
    conditions.push(`is_active = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`comment_text ILIKE $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      ${whereClause}
      ORDER BY machine_model ASC, service_stage ASC, id ASC
    `,
    params
  );

  return result.rows;
}

async function findById(id) {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');
  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function findForReport({ machineModel, documentType, serviceStage }) {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');

  if (table !== 'eqp_report_comments') {
    return findAll();
  }

  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE machine_model = $1
        AND document_type = $2
        AND service_stage = $3
        AND is_active = true
      ORDER BY id
    `,
    [machineModel, documentType, serviceStage]
  );

  return result.rows;
}

async function create({
  machineModel = 'HM400',
  documentType = 'in_operation',
  serviceStage = 'scheduled_service',
  commentText,
  frequency = 1,
  isActive = true,
  createdById = null,
}) {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');
  const result = await db.query(
    `
      INSERT INTO ${table} (
        machine_model,
        document_type,
        service_stage,
        comment_text,
        frequency,
        is_active,
        created_at,
        updated_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)
      RETURNING *
    `,
    [machineModel, documentType, serviceStage, commentText.trim(), Number(frequency) || 1, Boolean(isActive), createdById]
  );
  return result.rows[0];
}

async function update(id, {
  machineModel,
  documentType,
  serviceStage,
  commentText,
  frequency,
  isActive,
  updatedById = null,
}) {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');
  const current = await findById(id);
  if (!current) return null;

  const nextModel = machineModel !== undefined ? machineModel : current.machine_model;
  const nextDocType = documentType !== undefined ? documentType : current.document_type;
  const nextStage = serviceStage !== undefined ? serviceStage : current.service_stage;
  const nextText = commentText !== undefined ? commentText.trim() : current.comment_text;
  const nextFreq = frequency !== undefined ? Number(frequency) || 1 : current.frequency;
  const nextActive = isActive !== undefined ? Boolean(isActive) : current.is_active;

  const result = await db.query(
    `
      UPDATE ${table}
      SET machine_model = $1,
          document_type = $2,
          service_stage = $3,
          comment_text = $4,
          frequency = $5,
          is_active = $6,
          updated_at = NOW(),
          updated_by = $7
      WHERE id = $8
      RETURNING *
    `,
    [nextModel, nextDocType, nextStage, nextText, nextFreq, nextActive, updatedById, id]
  );
  return result.rows[0];
}

async function remove(id) {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');
  const result = await db.query(
    `
      DELETE FROM ${table}
      WHERE id = $1
      RETURNING *
    `,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  findForReport,
  create,
  update,
  remove,
};
