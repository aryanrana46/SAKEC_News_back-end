const News = require('../models/News');
const User = require('../models/User'); // We need the User model for this
const sendEmail = require('../utils/sendEmail'); // And our email utility

// Get all news
const getAllNews = async (req, res) => {
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
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create new news
const createNews = async (req, res) => {
  const { title, description, category, source } = req.body; 
  try {
    const news = new News({ title, description, category, source });
    const savedNews = await news.save(); // Save the news and store the result

    // --- START: New Email Notification Logic ---
    // This runs in the background after the admin's request is fulfilled.
    try {
      console.log('Attempting to send notification emails...');
      
      // 1. Find all verified users
      const usersToNotify = await User.find({ isVerified: true });
      
      if (usersToNotify.length === 0) {
        console.log('No verified users found to notify.');
      } else {
        console.log(`Found ${usersToNotify.length} verified users to notify.`);
      }
      
      // 2. Create the email content
      const linkToSite = process.env.FRONTEND_URL || 'http://localhost:3000';
      const message = `
        A new article has been posted on Terna News:

        Title: ${savedNews.title}
        Category: ${savedNews.category}

        Visit ${linkToSite} to read more.
      `;

      // 3. Loop and send email to each user
      for (const user of usersToNotify) {
        await sendEmail({
          email: user.email,
          subject: `New Post in Terna News: ${savedNews.title}`,
          message,
        });
        console.log(`Notification email sent to ${user.email}`);
      }
      console.log('Finished sending all notification emails.');
    } catch (emailError) {
      // If emails fail, it won't crash the server. It will just log the error.
      console.error('CRITICAL: Could not send notification emails. Error:', emailError);
    }
    // --- END: New Email Notification Logic ---

    // Respond to the admin immediately so they don't have to wait for emails to send.
    res.status(201).json(savedNews);

  } catch (error) {
    res.status(400).json({ message: 'Error creating news' });
  }
};

// Rate a News Article
const rateNewsArticle = async (req, res) => {
  const { rating } = req.body;
  const newsId = req.params.id;

  try {
    const news = await News.findById(newsId);
    if (news) {
      const alreadyRated = news.ratings.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyRated) {
        return res.status(400).json({ message: 'You have already rated this article.' });
      }
      const newRating = {
        rating: Number(rating),
        user: req.user._id,
      };
      news.ratings.push(newRating);
      news.numReviews = news.ratings.length;
      news.averageRating =
        news.ratings.reduce((acc, item) => item.rating + acc, 0) /
        news.ratings.length;
      await news.save();
      res.status(201).json({ message: 'Rating added successfully' });
    } else {
      res.status(404).json({ message: 'News article not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get News Recommendations
const getRecommendedNews = async (req, res) => {
    try {
        const currentUser = req.user;
        const highlyRatedNews = await News.find({ 'ratings.user': currentUser._id, 'ratings.rating': { $gte: 4 } });
        const highlyRatedNewsIds = highlyRatedNews.map(news => news._id);

        if (highlyRatedNewsIds.length === 0) {
            const topNews = await News.find({}).sort({ averageRating: -1 }).limit(5);
            return res.json(topNews);
        }

        const similarUsers = await News.aggregate([
            { $match: { _id: { $in: highlyRatedNewsIds } } },
            { $unwind: '$ratings' },
            { $match: { 'ratings.rating': { $gte: 4 }, 'ratings.user': { $ne: currentUser._id } } },
            { $group: { _id: '$ratings.user', sharedLikes: { $sum: 1 } } },
            { $sort: { sharedLikes: -1 } },
            { $limit: 10 }
        ]);
        const similarUserIds = similarUsers.map(user => user._id);

        if (similarUserIds.length === 0) {
            const topNews = await News.find({}).sort({ averageRating: -1 }).limit(5);
            return res.json(topNews);
        }

        const recommendedNews = await News.aggregate([
            { $match: { 'ratings.user': { $in: similarUserIds }, 'ratings.rating': { $gte: 4 } } },
            { $match: { 'ratings.user': { $ne: currentUser._id } } },
            { $sort: { averageRating: -1 } },
            { $limit: 5 }
        ]);
        
        res.json(recommendedNews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error while fetching recommendations' });
    }
};

// Update news
const updateNews = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedNews = await News.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: 'Error updating news' });
  }
};

// Delete news
const deleteNews = async (req, res) => {
  const { id } = req.params;
  try {
    await News.findByIdAndDelete(id);
    res.json({ message: 'News deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting news' });
  }
};

module.exports = { getAllNews, createNews, updateNews, deleteNews, rateNewsArticle, getRecommendedNews };
