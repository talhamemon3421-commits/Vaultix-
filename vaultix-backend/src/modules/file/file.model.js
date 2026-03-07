const { pool } = require('../../infrastructure/database');

const findFileByNameAndFolder = async (userId, folderId, fileName) => {
  const result = await pool.query(
    `SELECT id FROM files 
     WHERE user_id = $1 
     AND folder_id = $2 
     AND file_name = $3
     AND deleted_at IS NULL`,
    [userId, folderId, fileName]
  );
  return result.rows[0];
};

const findFileById = async (fileId) => {
  const result = await pool.query(
    `SELECT * FROM files 
     WHERE id = $1 
     AND deleted_at IS NULL
     AND permanent_deleted_at IS NULL`,
    [fileId]
  );
  return result.rows[0];
};

const findFileByIdRaw = async (fileId) => {
  const result = await pool.query(
    `SELECT * FROM files WHERE id = $1 AND permanent_deleted_at IS NULL`,
    [fileId]
  );
  return result.rows[0];
};

const getFilesByFolderId = async (folderId) => {
  const result = await pool.query(
    `SELECT * FROM files 
     WHERE folder_id = $1 
     AND deleted_at IS NULL
     ORDER BY file_name ASC`,
    [folderId]
  );
  return result.rows;
};

const getFilesByFolderIds = async (folderIds) => {
  const result = await pool.query(
    `SELECT * FROM files 
     WHERE folder_id = ANY($1)
     AND deleted_at IS NULL
     ORDER BY file_name ASC`,
    [folderIds]
  );
  return result.rows;
};

const insertFileBatch = async (client, files) => {
  const results = [];
  for (const file of files) {
    const result = await client.query(
      `INSERT INTO files 
        (user_id, folder_id, file_name, original_name, file_size, file_type, storage_key, bucket_name, status, checksum)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, folder_id, file_name, original_name, file_size, file_type, storage_key, bucket_name, status, checksum, created_at`,
      [
        file.userId,
        file.folderId,
        file.fileName,
        file.originalName,
        file.fileSize,
        file.fileType,
        file.storageKey,
        file.bucketName,
        'initiated',
        file.checksum || null,
      ]
    );
    results.push(result.rows[0]);
  }
  return results;
};


const renameFile = async (fileId, fileName) => {
  const result = await pool.query(
    `UPDATE files SET file_name = $1 WHERE id = $2
     RETURNING id, user_id, folder_id, file_name, original_name, file_size, file_type, storage_key, bucket_name, status, created_at, updated_at`,
    [fileName, fileId]
  );
  return result.rows[0];
};

const moveFile = async (fileId, newFolderId) => {
  const result = await pool.query(
    `UPDATE files SET folder_id = $1 WHERE id = $2
     RETURNING id, user_id, folder_id, file_name, original_name, file_size, file_type, storage_key, bucket_name, status, created_at, updated_at`,
    [newFolderId, fileId]
  );
  return result.rows[0];
};

const softDeleteFile = async (fileId) => {
  const result = await pool.query(
    `UPDATE files SET deleted_at = NOW() WHERE id = $1
     RETURNING id, user_id, folder_id, file_name, original_name, file_size, file_type, storage_key, bucket_name, status, deleted_at`,
    [fileId]
  );
  return result.rows[0];
};

const markFileAsPermanentlyDeleted = async (fileId) => {
  await pool.query(
    `UPDATE files SET permanent_deleted_at = NOW() WHERE id = $1`,
    [fileId]
  );
};


const markFileAsUploaded = async (fileId, actualSize) => {
  const result = await pool.query(
    `UPDATE files SET status = 'uploaded', file_size = $1
     WHERE id = $2
     RETURNING id, user_id, folder_id, file_name, original_name, file_size, file_type, storage_key, bucket_name, status, created_at`,
    [actualSize, fileId]
  );
  return result.rows[0];
};

const permanentDeleteFile = async (fileId) => {
  await pool.query(
    `DELETE FROM files WHERE id = $1`,
    [fileId]
  );
};

const insertFileBatchTransaction = async (fileRecords) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = await insertFileBatch(client, fileRecords);
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const softDeleteFilesByFolderId = async (folderId) => {
  await pool.query(
    `UPDATE files SET deleted_at = NOW() 
     WHERE folder_id = $1 AND deleted_at IS NULL`,
    [folderId]
  );
};

const permanentDeleteFilesByFolderId = async (folderId) => {
  const result = await pool.query(
    `UPDATE files SET permanent_deleted_at = NOW() 
     WHERE folder_id = $1 AND permanent_deleted_at IS NULL
     RETURNING storage_key`,
    [folderId]
  );
  return result.rows;
};

module.exports = { 
  findFileByNameAndFolder, insertFileBatch, 
  findFileById, findFileByIdRaw, markFileAsUploaded, renameFile,
  getFilesByFolderId, getFilesByFolderIds, moveFile,
  softDeleteFile, permanentDeleteFile, markFileAsPermanentlyDeleted,
  insertFileBatchTransaction, softDeleteFilesByFolderId,
  permanentDeleteFilesByFolderId
};