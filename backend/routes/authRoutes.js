const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');

const router = express.Router();

// Middleware to parse JSON
router.use(express.json());

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

// POST /api/register - User registration
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Insert new user
    const result = await executeQuery(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, password]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/login - User login
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with matching email and password
    const users = await executeQuery(
      'SELECT id, email, created_at FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/logout - User logout
router.post('/logout', (req, res) => {
  // Since we're using localStorage for session management,
  // logout is handled on the client side
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;