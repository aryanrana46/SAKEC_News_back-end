const express = require('express');
const News = require('../models/News');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
// --- CHANGE 1: Import the new controller functions ---
const { 
  rateNewsArticle, 
  getRecommendedNews // New function for recommendations
} = require('../controllers/newsController');


// --- START: New Route for Recommendations ---
// This route is protected, so only logged-in users can get recommendations.
router.route('/recommendations').get(protect, getRecommendedNews);
// --- END: New Route ---


// This route remains public so everyone can see the news.
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    let news;
    if (category) {
      news = await News.find({ category });
    } else {
      news = await News.find();
    }
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// This route also remains public.
router.get('/:id', async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new news item (ADMIN ONLY)
router.post('/', protect, admin, async (req, res) => {
  const { title, description, source, category } = req.body;
  const newsItem = new News({
    title,
    description,
    source,
    category,
  });

  try {
    const savedNews = await newsItem.save();
    res.status(201).json(savedNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// This route is protected, so only logged-in users can submit a rating.
router.route('/:id/rate').post(protect, rateNewsArticle);


// Update a news item by ID (ADMIN ONLY)
router.put('/:id', protect, admin, async (req, res) => {
  const { title, description, source, category } = req.body;

  try {
    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      { title, description, source, category },
      { new: true, runValidators: true }
    );

    if (!updatedNews) {
      return res.status(404).json({ message: 'News item not found' });
    }

    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a news item by ID (ADMIN ONLY)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);

    if (!deletedNews) {
      return res.status(404).json({ message: 'News item not found' });
    }

    res.json({ message: 'News item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
