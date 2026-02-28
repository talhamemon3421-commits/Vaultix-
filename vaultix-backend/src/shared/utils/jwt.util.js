const jwt = require('jsonwebtoken');
const config = require('../../config');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwtAccessSecret,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    config.jwtRefreshSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = { generateTokens, verifyRefreshToken };