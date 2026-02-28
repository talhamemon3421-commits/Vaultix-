const { z } = require('zod');

const createFolderSchema = z.object({
  name: z
    .string({ required_error: 'Folder name is required' })
    .trim()
    .min(1, 'Folder name cannot be empty')
    .max(255, 'Folder name cannot exceed 255 characters'),

  parent_id: z
    .string({ required_error: 'Parent folder id is required' })
    .uuid('Parent id must be a valid UUID'),
});

const renameFolderSchema = z.object({
  name: z
    .string({ required_error: 'Folder name is required' })
    .trim()
    .min(1, 'Folder name cannot be empty')
    .max(255, 'Folder name cannot exceed 255 characters'),
});

const moveFolderSchema = z.object({
  new_parent_id: z
    .string({ required_error: 'New parent folder id is required' })
    .uuid('New parent id must be a valid UUID'),
});

module.exports = { createFolderSchema, renameFolderSchema, moveFolderSchema };