import express from 'express';
import { check, validationResult } from 'express-validator';
import Activity from '../models/Activity.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 15 minutes.'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many accounts created from this IP, please try again after an hour.'
});


const router = express.Router();
const SECRET_KEY = 'your-secret-key'; // Change this in production

// Login route with input sanitization and validation
router.post('/login', loginLimiter, [
  // Validate and sanitize inputs:
  check('username')
    .trim()
    .escape()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters long'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT Token
  const token = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

  // Log the sign-in event
  try {
    const activity = new Activity({ type: 'signIn', username: user.username });
    await activity.save();
  } catch (error) {
    console.error("Sign-in logging error:", error);
    // Optionally, you can continue even if logging fails.
  }

  // Send token and user info as response
  res.json({
    message: 'Login successful',
    token,
    username: user.username
  });
});

// Registration route with input sanitization and validation
router.post('/register', registerLimiter, [
  // Validate and sanitize inputs:
  check('username')
    .trim()
    .escape()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters long')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ username, passwordHash: hashedPassword });
    await newUser.save();

    // Log the registration event
    try {
      const activity = new Activity({ type: 'registration', username: newUser.username });
      await activity.save();
    } catch (error) {
      console.error("Registration logging error:", error);
    }

    // Send success response
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
