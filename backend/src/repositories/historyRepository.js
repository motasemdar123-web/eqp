const db = require('../config/database');

async function findAll() {
  const result = await db.query(`
    SELECT
      mh.*,
      m.machine_number,
      m.machine_type
    FROM machine_history mh
    JOIN machines m
      ON mh.machine_id = m.id
    ORDER BY mh.created_at DESC
  `);

  return result.rows;
}

module.exports = { findAll };
