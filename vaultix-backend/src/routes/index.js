const express = require('express');
const router = express.Router();
const authRoutes = require('../modules/auth/auth.routes');
const folderRoutes = require('../modules/folder/folder.routes');

router.use('/auth', authRoutes);
router.use('/folders', folderRoutes);

module.exports = router;