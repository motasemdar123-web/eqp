const db = require('../config/database');

async function findByUserNumber(userNumber) {
  const result = await db.query(
    `
      SELECT *
      FROM users
      WHERE user_number = $1
    `,
    [userNumber]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  const result = await db.query(
    `
      SELECT *
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = { findByUserNumber, findById };
