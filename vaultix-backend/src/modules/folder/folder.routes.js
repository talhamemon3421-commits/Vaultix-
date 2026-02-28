const express = require('express');
const router = express.Router();
const { createFolder, renameFolder, moveFolderHandler, 
    getRoot, getFolderById, getFolderContentsHandler } = require('./folder.controller');
const { authMiddleware } = require('../../middleware/auth');

router.post('/', authMiddleware, createFolder);
router.get('/root', authMiddleware, getRoot);
router.patch('/:id/rename', authMiddleware, renameFolder);
router.patch('/:id/move', authMiddleware, moveFolderHandler);
router.get('/:id', authMiddleware, getFolderById);
router.get('/:id/contents', authMiddleware, getFolderContentsHandler);


module.exports = router;