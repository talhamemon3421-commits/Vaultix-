const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { register,login } = require('./auth.controller');

router.post('/register', register);
router.post('/login', login);


router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;