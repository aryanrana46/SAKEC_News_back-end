const express = require('express');
const { check } = require('express-validator');
// --- CHANGE 1: Import the new verifyEmail controller ---
const { registerUser, loginUser, verifyEmail } = require('../controllers/userController');
const router = express.Router();

// Validation for registering a user
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], registerUser);

// Validation for logging in a user
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], loginUser);

// --- CHANGE 2: Add the new route for email verification ---
router.get('/verify/:token', verifyEmail);


// Additional route for admin registration (optional)
router.post('/admin/register', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], (req, res) => {
  req.body.userType = 'admin';
  registerUser(req, res);
});

module.exports = router;
