const db = require('../config/database');

async function findAll() {
  const result = await db.query(`
    SELECT *
    FROM report_comments
  `);

  return result.rows;
}

module.exports = { findAll };
