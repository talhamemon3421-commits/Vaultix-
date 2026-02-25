const { registerUser ,loginUser, refreshTokens} = require('./auth.service');
const { registerSchema, loginSchema, refreshTokenSchema } = require('./auth.validator');

const register = async (req, res) => {
  try {
    // validate with zod
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({
            field: e.path[0],
            message: e.message,
        })),
      });
    }

    const { name, email, password } = parsed.data;
    const result = await registerUser(name, email, password);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result,
    });

  } catch (err) {
    if (err.message === 'Email already in use') {
      return res.status(409).json({
        success: false,
        message: err.message,
      });
    }

    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }

    const { email, password } = parsed.data;
    const result = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });

  } catch (err) {
    if (err.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }

    const result = await refreshTokens(parsed.data.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: result,
    });

  } catch (err) {
    if (
      err.message === 'Refresh token expired' ||
      err.message === 'Invalid refresh token' ||
      err.message === 'User no longer exists'
    ) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    console.error('Refresh token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = { register, login, refreshToken, logout };