const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { pool } = require('../../infrastructure/database');
const { findFileByNameAndFolder, insertFileBatch } = require('./file.model');
const { findFolderById } = require('../folder/folder.model');
const { generatePresignedUploadUrl } = require('../../infrastructure/storage');
const config = require('../../config');

const sanitizeFileName = (name) => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
    .replace(/\s+/g, '_');
};

const initiateUpload = async (userId, folderId, files) => {
  // folder validation
  if (folderId !== null) {
    const folder = await findFolderById(folderId);
    if (!folder) {
        console.error(`Folder with ID ${folderId} not found for user ${userId}`);
      throw new Error('FOLDER_NOT_FOUNDs');
    }
    if (folder.user_id !== userId) {
      throw new Error('FOLDER_NOT_FOUNDss'); // resource hiding
    }
  }

  // check duplicate names within request
  const names = files.map(f => f.originalName.trim().toLowerCase());
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    throw new Error('NAME_CONFLICT');
  }

  // check name collision with existing files in folder
  for (const file of files) {
    const sanitizedName = sanitizeFileName(file.originalName);
    const existing = await findFileByNameAndFolder(userId, folderId, sanitizedName);
    if (existing) {
      throw new Error('NAME_CONFLICT');
    }
  }

  // prepare file records
  const fileRecords = files.map(file => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalName);
    const sanitizedName = sanitizeFileName(file.originalName);
    const storageKey = `${userId}/${fileId}${ext}`;

    return {
      fileId,
      userId,
      folderId,
      fileName: sanitizedName,
      originalName: file.originalName.trim(),
      fileSize: file.fileSize,
      fileType: file.fileType,
      storageKey,
      bucketName: config.r2.bucketName,
      checksum: file.checksum || null,
    };
  });

  // insert all files in transaction
  const client = await pool.connect();
  let insertedFiles;

  try {
    await client.query('BEGIN');
    insertedFiles = await insertFileBatch(client, fileRecords);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // generate presigned urls after successful db insert
  const uploads = await Promise.all(
    insertedFiles.map(async (file, index) => {
      const uploadUrl = await generatePresignedUploadUrl(
        file.storage_key,
        file.file_type,
        18000 // 5 hours
      );

      return {
        fileId: file.id,
        originalName: file.original_name,
        fileSize: file.file_size,
        storageKey: file.storage_key,
        bucketName: file.bucket_name,
        uploadUrl,
        expiresIn: 18000,
        status: file.status,
      };
    })
  );

  return uploads;
};

module.exports = { initiateUpload };