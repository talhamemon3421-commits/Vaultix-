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

module.exports = { findFileByNameAndFolder, insertFileBatch };