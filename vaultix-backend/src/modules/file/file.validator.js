const { z } = require('zod');

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_FILES_PER_REQUEST = 10;

const fileSchema = z.object({
  originalName: z
    .string({ required_error: 'File name is required' })
    .trim()
    .min(1, 'File name cannot be empty')
    .max(255, 'File name cannot exceed 255 characters'),

  fileSize: z
    .number({ required_error: 'File size is required' })
    .int('File size must be an integer')
    .positive('File size must be greater than 0')
    .max(MAX_FILE_SIZE, 'File size cannot exceed 5GB'),

  fileType: z
    .string({ required_error: 'File type is required' })
    .trim()
    .min(1, 'File type cannot be empty'),

  checksum: z
    .string()
    .optional(),
});

const initiateUploadSchema = z.object({
  folderId: z
    .string()
    .uuid('Folder id must be a valid UUID')
    .nullable()
    .default(null),

  files: z
    .array(fileSchema)
    .min(1, 'At least one file is required')
    .max(MAX_FILES_PER_REQUEST, `Cannot upload more than ${MAX_FILES_PER_REQUEST} files at once`),
});

module.exports = { initiateUploadSchema };