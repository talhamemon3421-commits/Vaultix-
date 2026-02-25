const bcrypt = require('bcrypt');
const { createUser, findUserByEmail, updateLastLogin, findUserById } = require('../user/user.model');
const { createRootFolder } = require('../folder/folder.model');
const { generateTokens, verifyRefreshToken } = require('../../shared/utils/jwt.util');
const { sanitizeUser } = require('../../shared/utils/sanitize.util');

const registerUser = async (name, email, password) => {
  // check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already in use');
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // create user
  const user = await createUser(name, email, hashedPassword);

  // create root folder for user
  await createRootFolder(user.id);

  // generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

const loginUser = async (email, password) => {
  // find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // compare password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // update last login
  await updateLastLogin(user.id);

  // generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

const refreshTokens = async (token) => {
  // verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }

  // check user still exists
  const user = await findUserById(decoded.userId);
  if (!user) {
    throw new Error('User no longer exists');
  }

  // generate new tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

module.exports = { registerUser, loginUser, refreshTokens };
