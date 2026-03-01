const express = require('express');
const router = express.Router();
const { initiateUploadHandler } = require('./file.controller');
const { authMiddleware } = require('../../middleware/auth');

router.post('/initiate', authMiddleware, initiateUploadHandler);

module.exports = router;