const { initiateUpload, confirmUpload, 
  getFileDetails, 
  renameExistingFile,moveExistingFile,softDeleteExistingFile,permanentDeleteExistingFile
 } = require('./file.service');
const { initiateUploadSchema , confirmUploadSchema, renameFileSchema,moveFileSchema} = require('./file.validator');

const ERROR_STATUS = {
  FOLDER_NOT_FOUND: 404,
  NAME_CONFLICT: 409,
  QUOTA_EXCEEDED: 429,
  INVALID_FILE_TYPE: 415,
  MAX_FILES_EXCEEDED: 400,
  UNAUTHORIZED: 401,
};

const initiateUploadHandler = async (req, res) => {
  try {
    const parsed = initiateUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues[0].message,
        },
      });
    }

    const { folderId, files } = parsed.data;
    const userId = req.user.userId;

    const uploads = await initiateUpload(userId, folderId, files);

    return res.status(200).json({ uploads });

  } catch (err) {
    const status = ERROR_STATUS[err.message] || 500;
    return res.status(status).json({
      error: {
        code: err.message || 'INTERNAL_ERROR',
        message: getErrorMessage(err.message),
      },
    });
  }
};

const getErrorMessage = (code) => {
  const messages = {
    FOLDER_NOT_FOUND: 'Folder not found.',
    NAME_CONFLICT: 'A file with the same name already exists in this folder.',
    QUOTA_EXCEEDED: 'Storage limit exceeded.',
    INVALID_FILE_TYPE: 'File type not allowed.',
    MAX_FILES_EXCEEDED: 'Too many files in one request.',
    UNAUTHORIZED: 'Unauthorized.',
  };
  return messages[code] || 'An unexpected error occurred.';
};

const confirmUploadHandler = async (req, res) => {
  try {
    const parsed = confirmUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues[0].message,
        },
      });
    }

    const { fileId } = parsed.data;
    const file = await confirmUpload(req.user.userId, fileId);

    return res.status(200).json({
      success: true,
      message: 'File upload confirmed successfully',
      data: file,
    });

  } catch (err) {
    const ERROR_STATUS = {
      FILE_NOT_FOUND: 404,
      ALREADY_CONFIRMED: 409,
      FILE_NOT_IN_STORAGE: 424,
      FILE_SIZE_MISMATCH: 422,
    };

    const status = ERROR_STATUS[err.message] || 500;
    const messages = {
      FILE_NOT_FOUND: 'File not found.',
      ALREADY_CONFIRMED: 'File has already been confirmed.',
      FILE_NOT_IN_STORAGE: 'File was not found in storage. Please upload again.',
      FILE_SIZE_MISMATCH: 'Uploaded file size does not match expected size.',
    };

    return res.status(status).json({
      error: {
        code: err.message,
        message: messages[err.message] || err.message,
      },
    });
  }
};

const getFileByIdHandler = async (req, res) => {
  try {
    const file = await getFileDetails(req.user.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'File retrieved successfully',
      data: file,
    });
  } catch (err) {
    const ERROR_STATUS = { FILE_NOT_FOUND: 404 };
    const status = ERROR_STATUS[err.message] || 500;
    return res.status(status).json({
      error: {
        code: err.message,
        message: err.message === 'FILE_NOT_FOUND' ? 'File not found.' : err.message,
      },
    });
  }
};

const renameFileHandler = async (req, res) => {
  try {
    const parsed = renameFileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues[0].message,
        },
      });
    }

    const { fileName } = parsed.data;
    const file = await renameExistingFile(req.user.userId, req.params.id, fileName);

    return res.status(200).json({
      success: true,
      message: 'File renamed successfully',
      data: file,
    });

  } catch (err) {
    const ERROR_STATUS = {
      FILE_NOT_FOUND: 404,
      FILE_NOT_UPLOADED: 400,
      NAME_CONFLICT: 409,
    };
    const messages = {
      FILE_NOT_FOUND: 'File not found.',
      FILE_NOT_UPLOADED: 'Only uploaded files can be renamed.',
      NAME_CONFLICT: 'A file with this name already exists in this folder.',
    };
    const status = ERROR_STATUS[err.message] || 500;
    return res.status(status).json({
      error: {
        code: err.message,
        message: messages[err.message] || err.message,
      },
    });
  }
};

const moveFileHandler = async (req, res) => {
  try {
    const parsed = moveFileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues[0].message,
        },
      });
    }

    const { folderId } = parsed.data;
    const file = await moveExistingFile(req.user.userId, req.params.id, folderId);

    return res.status(200).json({
      success: true,
      message: 'File moved successfully',
      data: file,
    });

  } catch (err) {
    const ERROR_STATUS = {
      FILE_NOT_FOUND: 404,
      FOLDER_NOT_FOUND: 404,
      FILE_NOT_UPLOADED: 400,
      ALREADY_IN_DESTINATION: 409,
      NAME_CONFLICT: 409,
    };
    const messages = {
      FILE_NOT_FOUND: 'File not found.',
      FOLDER_NOT_FOUND: 'Folder not found.',
      FILE_NOT_UPLOADED: 'Only uploaded files can be moved.',
      ALREADY_IN_DESTINATION: 'File is already in this folder.',
      NAME_CONFLICT: 'A file with this name already exists in the destination folder.',
    };
    const status = ERROR_STATUS[err.message] || 500;
    return res.status(status).json({
      error: {
        code: err.message,
        message: messages[err.message] || err.message,
      },
    });
  }
};

const softDeleteFileHandler = async (req, res) => {
  try {
    const file = await softDeleteExistingFile(req.user.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: file,
    });
  } catch (err) {
    const ERROR_STATUS = {
      FILE_NOT_FOUND: 404,
      FILE_ALREADY_DELETED: 409,
    };
    const messages = {
      FILE_NOT_FOUND: 'File not found.',
      FILE_ALREADY_DELETED: 'File is already deleted.',
    };
    const status = ERROR_STATUS[err.message] || 500;
    return res.status(status).json({
      error: {
        code: err.message,
        message: messages[err.message] || err.message,
      },
    });
  }
};

const permanentDeleteFileHandler = async (req, res) => {
  try {
    await permanentDeleteExistingFile(req.user.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'File permanently deleted successfully',
    });
  } catch (err) {
    const ERROR_STATUS = {
      FILE_NOT_FOUND: 404,
    };
    const messages = {
      FILE_NOT_FOUND: 'File not found.',
    };
    const status = ERROR_STATUS[err.message] || 500;
    return res.status(status).json({
      error: {
        code: err.message,
        message: messages[err.message] || err.message,
      },
    });
  }
};

module.exports = { initiateUploadHandler, confirmUploadHandler, getFileByIdHandler, renameFileHandler, moveFileHandler, softDeleteFileHandler, permanentDeleteFileHandler };