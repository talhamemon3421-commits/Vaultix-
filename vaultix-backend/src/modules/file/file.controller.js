const { initiateUpload } = require('./file.service');
const { initiateUploadSchema } = require('./file.validator');

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

module.exports = { initiateUploadHandler };