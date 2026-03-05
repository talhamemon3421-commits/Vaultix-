const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { findFileByNameAndFolder, insertFileBatchTransaction, 
    markFileAsUploaded, findFileById, findFileByIdRaw, renameFile,
    moveFile, softDeleteFile, markFileAsPermanentlyDeleted, softDeleteFilesByFolderId } = require('./file.model');
const { findFolderById} = require('../folder/folder.model');
const { generatePresignedUploadUrl
   , verifyFileInStorage, deleteFileFromStorage, generatePresignedDownloadUrl} = require('../../infrastructure/storage');
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
  const insertedFiles = await insertFileBatchTransaction(fileRecords);

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

const confirmUpload = async (userId, fileId) => {
  // 1. check file exists in DB
  const file = await findFileById(fileId);
  if (!file) {
    throw new Error('FILE_NOT_FOUND');
  }

  // 2. check file belongs to user
  if (file.user_id !== userId) {
    throw new Error('FILE_NOT_FOUND');
  }

  // 3. check file is still in initiated status
  if (file.status !== 'initiated') {
    throw new Error('ALREADY_CONFIRMED');
  }

  // 4. verify file actually exists in R2
  const { exists, size } = await verifyFileInStorage(file.storage_key);
  if (!exists) {
    throw new Error('FILE_NOT_IN_STORAGE');
  }

  // 5. mark as uploaded with actual size from R2
  const updatedFile = await markFileAsUploaded(fileId, size);
  return updatedFile;
};

const getFileDetails = async (userId, fileId) => {
  const file = await findFileById(fileId);
  if (!file) {
    throw new Error('FILE_NOT_FOUND');
  }

  if (file.user_id !== userId) {
    throw new Error('FILE_NOT_FOUND'); // resource hiding
  }

  return file;
};

const renameExistingFile = async (userId, fileId, fileName) => {
  // check file exists

  const file = await findFileById(fileId);
  if (!file) {
    throw new Error('FILE_NOT_FOUND');
  }

  if (file.deleted_at) {
  throw new Error('FILE_ALREADY_DELETED');
}

  // check file belongs to user
  if (file.user_id !== userId) {
    throw new Error('FILE_NOT_FOUND');
  }

  // check file is uploaded
  if (file.status !== 'uploaded') {
    throw new Error('FILE_NOT_UPLOADED');
  }

  // sanitize new name
  const sanitizedName = sanitizeFileName(fileName);

  // check uniqueness in same folder
  const existing = await findFileByNameAndFolder(userId, file.folder_id, sanitizedName);
  if (existing && existing.id !== fileId) {
    throw new Error('NAME_CONFLICT');
  }

  const updatedFile = await renameFile(fileId, sanitizedName);
  return updatedFile;
};

const moveExistingFile = async (userId, fileId, newFolderId) => {
  // 1. check file exists
  const file = await findFileById(fileId);
  if (!file) {
    throw new Error('FILE_NOT_FOUND');
  }

  if (file.deleted_at) {
  throw new Error('FILE_ALREADY_DELETED');
}

  // 2. check file belongs to user
  if (file.user_id !== userId) {
    throw new Error('FILE_NOT_FOUND');
  }

  // 3. check file is uploaded
  if (file.status !== 'uploaded') {
    throw new Error('FILE_NOT_UPLOADED');
  }

  // 4. check destination folder exists
  const folder = await findFolderById(newFolderId);
  if (!folder) {
    throw new Error('FOLDER_NOT_FOUND');
  }

  // 5. check destination folder belongs to user
  if (folder.user_id !== userId) {
    throw new Error('FOLDER_NOT_FOUND');
  }

  // 6. check file is not already in destination
  if (file.folder_id === newFolderId) {
    throw new Error('ALREADY_IN_DESTINATION');
  }

  // 7. check name uniqueness in destination
  const existing = await findFileByNameAndFolder(userId, newFolderId, file.file_name);
  if (existing) {
    throw new Error('NAME_CONFLICT');
  }

  const movedFile = await moveFile(fileId, newFolderId);
  return movedFile;
};

const softDeleteExistingFile = async (userId, fileId) => {
  // 1. check file exists
  const file = await findFileById(fileId);
  if (!file) {
    throw new Error('FILE_NOT_FOUND');
  }

  // 2. check file belongs to user
  if (file.user_id !== userId) {
    throw new Error('FILE_NOT_FOUND');
  }

  // 3. check file is not already deleted
  if (file.deleted_at) {
    throw new Error('FILE_ALREADY_DELETED');
  }

  const deletedFile = await softDeleteFile(fileId);
  return deletedFile;
};

const permanentDeleteExistingFile = async (userId, fileId) => {
  const file = await findFileByIdRaw(fileId);

  if (!file) {
    throw new Error('FILE_NOT_FOUND');
  }

  if (file.user_id !== userId) {
    throw new Error('FILE_NOT_FOUND');
  }

  if (file.permanent_deleted_at) {
    throw new Error('FILE_ALREADY_PERMANENTLY_DELETED');
  }

  await deleteFileFromStorage(file.storage_key);
  await markFileAsPermanentlyDeleted(fileId);
};

const downloadFile = async (userId, fileId) => {
  // 1. check file exists
  const file = await findFileById(fileId);
  if (!file) {
    throw new Error('FILE_NOT_FOUND');
  }

  // 2. check file belongs to user
  if (file.user_id !== userId) {
    throw new Error('FILE_NOT_FOUND');
  }

  // 3. check file is uploaded
  if (file.status !== 'uploaded') {
    throw new Error('FILE_NOT_UPLOADED');
  }

  // 4. generate presigned download url
  const downloadUrl = await generatePresignedDownloadUrl(
    file.storage_key,
    file.file_name,  // changed from file.original_name
    3600
  );

  return {
    fileId: file.id,
    originalName: file.file_name,  // changed from file.original_name
    fileSize: file.file_size,
    fileType: file.file_type,
    downloadUrl,
    expiresIn: 3600,
  };
};

module.exports = { initiateUpload, confirmUpload, getFileDetails, 
  renameExistingFile, moveExistingFile, softDeleteExistingFile, permanentDeleteExistingFile, downloadFile };