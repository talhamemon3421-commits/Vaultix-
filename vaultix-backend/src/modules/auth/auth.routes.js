const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { register,login, refreshToken, logout } = require('./auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: req.user });
});
router.post('/refresh-token', refreshToken);

module.exports = router;