const crypto = require('crypto'); // Built-in Node.js module
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail'); // Import our email utility

// Register a new user
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, adminCode } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let isAdmin = false;
    if (adminCode && adminCode === process.env.ADMIN_REGISTRATION_KEY) {
      isAdmin = true;
    }
    
    // --- START: Email Verification Logic ---
    // Create the user but don't log them in yet
    user = new User({
      name,
      email,
      password,
      isAdmin,
    });

    // 1. Generate a random verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;

    await user.save(); // Save user with the token

    // 2. Send the verification email
    const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const message = `Welcome to SAKEC News! Please verify your email by clicking this link: ${verificationURL}`;

    await sendEmail({
      email: user.email,
      subject: 'SAKEC News - Email Verification',
      message,
    });

    // 3. Send a response telling the user to check their email
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });
    // --- END: Email Verification Logic (Note: Auto-login is removed) ---

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// --- START: New Function to Verify Email ---
const verifyEmail = async (req, res) => {
    try {
        const verificationToken = req.params.token;
        const user = await User.findOne({ verificationToken });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined; // Clear the token
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};
// --- END: New Function ---

// Log in an existing user
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // --- START: New Check for Email Verification ---
    if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email before logging in.' });
    }
    // --- END: New Check ---

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, verifyEmail };
