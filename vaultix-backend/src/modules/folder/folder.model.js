const { pool } = require('../../infrastructure/database');

const createRootFolder = async (client, userId) => {
  const result = await client.query(
    `INSERT INTO folders (user_id, name, is_root)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, is_root, created_at`,
    [userId, 'root', true]
  );
  return result.rows[0];
};

module.exports = { createRootFolder };