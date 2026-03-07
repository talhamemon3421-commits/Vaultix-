const { pool } = require('../../infrastructure/database');
const { createRootFolder } = require('../folder/folder.model');


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

const registerUserTransaction = async (name, email, hashedPassword) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert user
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, plan_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, is_email_verified, created_at`,
      [name, email, hashedPassword,]
    );
    const user = result.rows[0];

    // Create root folder
    await createRootFolder(client, user.id);

    await client.query('COMMIT');
    return user;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { findUserByEmail, findUserById, updateLastLogin, registerUserTransaction };