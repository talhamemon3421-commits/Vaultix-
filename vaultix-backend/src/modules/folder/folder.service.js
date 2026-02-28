const {
  createFolder,
  findFolderById,
  renameFolder,
  findFolderByNameAndParent,
  getDescendants,
  moveFolder,
  findRootFolder,
  getFolderContents
} = require('./folder.model');

const createNewFolder = async (userId, name, parentId) => {
  // check parent exists
  const parentFolder = await findFolderById(parentId);
  if (!parentFolder) {
    throw new Error('Parent folder not found');
  }

  // check parent belongs to user
  if (parentFolder.user_id !== userId) {
    throw new Error('Access denied');
  }

  // check name uniqueness under parent
  const existing = await findFolderByNameAndParent(userId, name, parentId);
  if (existing) {
    throw new Error('A folder with this name already exists here');
  }

  const folder = await createFolder(userId, name, parentId);
  return folder;
};

const renameExistingFolder = async (userId, folderId, name) => {
  const folder = await findFolderById(folderId);
  if (!folder) {
    throw new Error('Folder not found');
  }

  if (folder.user_id !== userId) {
    throw new Error('Access denied');
  }

  if (folder.is_root) {
    throw new Error('Root folder cannot be renamed');
  }

  // check name uniqueness under same parent
  const existing = await findFolderByNameAndParent(userId, name, folder.parent_id);
  if (existing) {
    throw new Error('A folder with this name already exists here');
  }

  const updatedFolder = await renameFolder(folderId, name);
  return updatedFolder;
};

const moveExistingFolder = async (userId, folderId, newParentId) => {

  // 1. check folder exists
  const folder = await findFolderById(folderId);
  if (!folder) {
    throw new Error('Folder not found');
  }

  // 2. check folder belongs to user
  if (folder.user_id !== userId) {
    throw new Error('Access denied');
  }

  // 3. cannot move root folder
  if (folder.is_root) {
    throw new Error('Root folder cannot be moved');
  }

  // 4. check new parent exists
  const newParent = await findFolderById(newParentId);
  if (!newParent) {
    throw new Error('Destination folder not found');
  }

  // 5. check new parent belongs to user
  if (newParent.user_id !== userId) {
    throw new Error('Access denied');
  }

  // 6. cannot move into itself
  if (folderId === newParentId) {
    throw new Error('Cannot move folder into itself');
  }

  // 7. cannot move into own descendant
  const descendants = await getDescendants(folderId);
  if (descendants.includes(newParentId)) {
    throw new Error('Cannot move folder into its own descendant');
  }

  // 8. cannot move to same destination
  if (folder.parent_id === newParentId) {
    throw new Error('Folder is already in this location');
  }

  // 9. name uniqueness in destination
  const existing = await findFolderByNameAndParent(userId, folder.name, newParentId);
  if (existing) {
    throw new Error('A folder with this name already exists in the destination');
  }

  const movedFolder = await moveFolder(folderId, newParentId);
  return movedFolder;
};

const getRootFolder = async (userId) => {
  const folder = await findRootFolder(userId);
  if (!folder) {
    throw new Error('Root folder not found');
  }
  return folder;
};

const getFolderDetails = async (userId, folderId) => {
  const folder = await findFolderById(folderId);
  if (!folder) {
    throw new Error('Folder not found');
  }

  if (folder.user_id !== userId) {
    throw new Error('Access denied');
  }

  return folder;
};

const getFolderChildren = async (userId, folderId) => {
  // check folder exists
  const folder = await findFolderById(folderId);
  if (!folder) {
    throw new Error('Folder not found');
  }

  // check folder belongs to user
  if (folder.user_id !== userId) {
    throw new Error('Access denied');
  }

  const contents = await getFolderContents(folderId);
  return contents;
};

module.exports = { createNewFolder, renameExistingFolder, moveExistingFolder 
  ,getRootFolder, getFolderDetails, getFolderChildren};