const 
{ createNewFolder, renameExistingFolder, moveExistingFolder, 
  getRootFolder, getFolderDetails, getFolderChildren, 
  getAllFolderContents, deleteFolderSoft, deleteFolderPermanent } = 
  require('./folder.service');
const { createFolderSchema, renameFolderSchema, moveFolderSchema } = require('./folder.validator');

const createFolder = async (req, res) => {
  try {
    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }

    const { name, parent_id } = parsed.data;
    const userId = req.user.userId;
    const folder = await createNewFolder(userId, name, parent_id);

    return res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder,
    });

  } catch (err) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('Create folder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const renameFolder = async (req, res) => {
  try {
    const parsed = renameFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }

    const { name } = parsed.data;
    const userId = req.user.userId;
    const folderId = req.params.id;
    const folder = await renameExistingFolder(userId, folderId, name);

    return res.status(200).json({
      success: true,
      message: 'Folder renamed successfully',
      data: folder,
    });

  } catch (err) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('Rename folder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


const moveFolderHandler = async (req, res) => {
  
  try {
    const parsed = moveFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }

    const { new_parent_id } = parsed.data;
    const folder = await moveExistingFolder(req.user.userId, req.params.id, new_parent_id);

    return res.status(200).json({
      success: true,
      message: 'Folder moved successfully',
      data: folder,
    });

  } catch (err) {
    console.error('Move folder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRoot = async (req, res) => {
  try {
    const folder = await getRootFolder(req.user.userId);
    return res.status(200).json({
      success: true,
      message: 'Root folder retrieved successfully',
      data: folder,
    });
  } catch (err) {
    console.error('Get root folder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getFolderById = async (req, res) => {
  try {
    const folder = await getFolderDetails(req.user.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Folder retrieved successfully',
      data: folder,
    });
  } catch (err) {
    console.error('Get folder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllFolderContentsHandler = async (req, res) => {
  try {
    const contents = await getAllFolderContents(req.user.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'All folder contents retrieved successfully',
      data: contents,
    });
  } catch (err) {
    console.error('Get all folder contents error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFolderHandler = async (req, res) => {
  try {
    await deleteFolderSoft(req.user.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (err) {
    console.error('Delete folder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
const permanentDeleteFolderHandler = async (req, res) => {
  try {
    await deleteFolderPermanent(req.user.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Folder permanently deleted successfully',
    });
  } catch (err) {
    console.error('Permanent delete folder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createFolder, renameFolder, moveFolderHandler
  , getRoot, getFolderById , getAllFolderContentsHandler, deleteFolderHandler, permanentDeleteFolderHandler};