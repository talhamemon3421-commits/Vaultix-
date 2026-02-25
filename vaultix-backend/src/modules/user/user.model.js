const { pool } = require('../../infrastructure/database');

const createUser = async (client, name, email, hashedPassword) => {
  const result = await client.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, is_email_verified, created_at`,
    [name, email, hashedPassword]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, is_email_verified, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

const updateLastLogin = async (id) => {
  await pool.query(
    `UPDATE users SET last_login = NOW() WHERE id = $1`,
    [id]
  );
};

module.exports = { createUser, findUserByEmail, findUserById, updateLastLogin };