const express = require('express');
const router = express.Router();
const { createFolder, renameFolder, moveFolderHandler, 
    getRoot, getFolderById, getAllFolderContentsHandler} = require('./folder.controller');
const { authMiddleware } = require('../../middleware/auth');

router.post('/', authMiddleware, createFolder);
router.get('/root', authMiddleware, getRoot);
router.patch('/:id/rename', authMiddleware, renameFolder);
router.patch('/:id/move', authMiddleware, moveFolderHandler);
router.get('/:id', authMiddleware, getFolderById);
router.get('/:id/contents', authMiddleware, getAllFolderContentsHandler);
router.get('/:id/all', authMiddleware, getAllFolderContentsHandler);


module.exports = router;