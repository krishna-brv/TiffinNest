import Review from '../models/Review.js';
import ProviderProfile from '../models/ProviderProfile.js';

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private/Customer
export const createReview = async (req, res) => {
  const { providerId, rating, comment } = req.body;

  try {
    const review = await Review.create({
      provider: providerId,
      customer: req.user._id,
      rating: Number(rating),
      comment,
    });

    // Update provider profile average rating and num reviews
    const reviews = await Review.find({ provider: providerId });
    const numReviews = reviews.length;
    const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

    await ProviderProfile.findOneAndUpdate(
      { user: providerId },
      { numReviews, averageRating }
    );

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
export const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId }).populate(
      'customer',
      'name'
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
