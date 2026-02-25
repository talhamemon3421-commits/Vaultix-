const { registerUser } = require('./auth.service');
const { registerSchema } = require('./auth.validator');

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

module.exports = { register };