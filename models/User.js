const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // --- START: New Fields for Email Verification ---
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  // --- END: New Fields for Email Verification ---
});

// Password encryption
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next(); // Use return to exit function early
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

// Check if the model is already compiled before defining it
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
