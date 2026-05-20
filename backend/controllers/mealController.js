import MealPlan from '../models/MealPlan.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Order from '../models/Order.js';

// @desc    Create a meal plan
// @route   POST /api/meals
// @access  Private/Provider
export const createMealPlan = async (req, res) => {
  const { name, description, type, frequency, price, items } = req.body;

  try {
    const mealPlan = await MealPlan.create({
      provider: req.user._id,
      name,
      description,
      type,
      frequency,
      price,
      items,
    });

    res.status(201).json(mealPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all meal plans for a provider
// @route   GET /api/meals/provider/:providerId
// @access  Public
export const getProviderMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ provider: req.params.providerId });
    res.json(mealPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a meal plan
// @route   PUT /api/meals/:id
// @access  Private/Provider
export const updateMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (mealPlan) {
      // Check if user is the owner
      if (mealPlan.provider.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this meal plan' });
      }

      mealPlan.name = req.body.name || mealPlan.name;
      mealPlan.description = req.body.description || mealPlan.description;
      mealPlan.type = req.body.type || mealPlan.type;
      mealPlan.frequency = req.body.frequency || mealPlan.frequency;
      mealPlan.price = req.body.price || mealPlan.price;
      mealPlan.items = req.body.items || mealPlan.items;
      mealPlan.isActive = req.body.isActive !== undefined ? req.body.isActive : mealPlan.isActive;

      const updatedMealPlan = await mealPlan.save();
      res.json(updatedMealPlan);
    } else {
      res.status(404).json({ message: 'Meal plan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a meal plan
// @route   DELETE /api/meals/:id
// @access  Private/Provider
export const deleteMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (mealPlan) {
      if (mealPlan.provider.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this meal plan' });
      }

      await mealPlan.deleteOne();
      res.json({ message: 'Meal plan removed' });
    } else {
      res.status(404).json({ message: 'Meal plan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/meals/:id/reviews
// @access  Private/Customer
export const createMealReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const meal = await MealPlan.findById(req.params.id);

    if (meal) {
      const deliveredOrder = await Order.findOne({
        customer: req.user._id,
        mealPlan: meal._id,
        $or: [
          { status: 'delivered' },
          { orderSchedule: { $elemMatch: { status: 'delivered' } } },
        ],
      });

      if (!deliveredOrder) {
        return res.status(400).json({ message: 'You can rate this item after it has been delivered' });
      }

      const alreadyReviewed = meal.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'You have already reviewed this meal' });
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      meal.reviews.push(review);
      meal.numReviews = meal.reviews.length;
      meal.rating =
        meal.reviews.reduce((acc, item) => item.rating + acc, 0) /
        meal.reviews.length;

      await meal.save();

      // Update the Provider's average rating
      const providerMeals = await MealPlan.find({ provider: meal.provider });
      const totalProviderReviews = providerMeals.reduce((acc, m) => acc + m.numReviews, 0);
      const avgProviderRating = providerMeals.reduce((acc, m) => acc + (m.rating * m.numReviews), 0) / (totalProviderReviews || 1);

      const providerProfile = await ProviderProfile.findOne({ user: meal.provider });
      if (providerProfile) {
        providerProfile.averageRating = avgProviderRating;
        providerProfile.numReviews = totalProviderReviews;
        await providerProfile.save();
      }

      res.status(201).json({ message: 'Review added successfully' });
    } else {
      res.status(404).json({ message: 'Meal not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
