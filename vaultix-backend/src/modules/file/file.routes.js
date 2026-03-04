const express = require('express');
const router = express.Router();
const { initiateUploadHandler , confirmUploadHandler,
     getFileByIdHandler, renameFileHandler, moveFileHandler, softDeleteFileHandler, permanentDeleteFileHandler} = require('./file.controller');
const { authMiddleware } = require('../../middleware/auth');

router.post('/initiate', authMiddleware, initiateUploadHandler);
router.post('/confirm', authMiddleware, confirmUploadHandler);
router.get('/:id', authMiddleware, getFileByIdHandler);
router.patch('/:id/rename', authMiddleware, renameFileHandler);
router.patch('/:id/move', authMiddleware, moveFileHandler);
router.delete('/:id', authMiddleware, softDeleteFileHandler);
router.delete('/:id/permanent', authMiddleware, permanentDeleteFileHandler);

module.exports = router;