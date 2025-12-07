// Mongoose model for news articles.

const mongoose = require('mongoose');

// New sub-schema for individual ratings
const ratingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User model
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['placement', 'tech-event', 'cultural-event', 'cutoff'],
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    // --- START: New Fields for Ratings ---
    ratings: [ratingSchema], // An array of rating objects
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    averageRating: {
      type: Number,
      required: true,
      default: 0,
    },
    // --- END: New Fields for Ratings ---
  },
  { timestamps: true }
);

const News = mongoose.model('News', newsSchema);
module.exports = News;