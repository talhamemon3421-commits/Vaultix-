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

const createFolder = async (userId, name, parentId) => {
  const result = await pool.query(
    `INSERT INTO folders (user_id, name, parent_id)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, parent_id, is_root, created_at`,
    [userId, name, parentId]
  );
  return result.rows[0];
};
const findFolderById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM folders WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

const renameFolder = async (id, name) => {
  const result = await pool.query(
    `UPDATE folders SET name = $1 WHERE id = $2
     RETURNING id, user_id, name, parent_id, is_root, created_at, updated_at`,
    [name, id]
  );
  return result.rows[0];
};

const findFolderByNameAndParent = async (userId, name, parentId) => {
  const result = await pool.query(
    `SELECT id FROM folders WHERE user_id = $1 AND name = $2 AND parent_id = $3`,
    [userId, name, parentId]
  );
  return result.rows[0];
};

const getAllDescendantFolders = async (folderId) => {
  const result = await pool.query(
    `WITH RECURSIVE descendants AS (
      SELECT * FROM folders WHERE id = $1
      UNION ALL
      SELECT f.* FROM folders f
      INNER JOIN descendants d ON f.parent_id = d.id
    )
    SELECT * FROM descendants`,
    [folderId]
  );
  return result.rows;
};

const moveFolder = async (folderId, newParentId) => {
  const result = await pool.query(
    `UPDATE folders SET parent_id = $1 WHERE id = $2
     RETURNING id, user_id, name, parent_id, is_root, created_at, updated_at`,
    [newParentId, folderId]
  );
  return result.rows[0];
};

const findRootFolder = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM folders WHERE user_id = $1 AND is_root = true`,
    [userId]
  );
  return result.rows[0];
};

const getFolderContents = async (folderId) => {
  const result = await pool.query(
    `SELECT * FROM folders WHERE parent_id = $1 ORDER BY name ASC`,
    [folderId]
  );
  return result.rows;
};

module.exports = {
  createRootFolder,
  createFolder,
  findFolderById,
  renameFolder,
  findFolderByNameAndParent,
  getAllDescendantFolders,
  moveFolder,
  findRootFolder,
  getFolderContents
};