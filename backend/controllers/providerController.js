import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';
import MealPlan from '../models/MealPlan.js';
import Order from '../models/Order.js';

// @desc    Create or update provider profile
// @route   POST /api/providers/profile
// @access  Private/Provider
export const upsertProviderProfile = async (req, res) => {
  const { cuisine, location, pricing, imageUrl, availability, closedDates, deliverySlots, deliveryTimings } = req.body;

  try {
    let profile = await ProviderProfile.findOne({ user: req.user._id });

    if (profile) {
      // Update
      profile.cuisine = cuisine || profile.cuisine;
      profile.location = location || profile.location;
      profile.pricing = pricing || profile.pricing;
      profile.imageUrl = imageUrl !== undefined ? imageUrl : profile.imageUrl;
      profile.availability = availability !== undefined ? availability : profile.availability;
      profile.closedDates = closedDates || profile.closedDates;
      profile.deliverySlots = deliverySlots || profile.deliverySlots;
      profile.deliveryTimings = deliveryTimings || profile.deliveryTimings;

      const updatedProfile = await profile.save();
      return res.json(updatedProfile);
    }

    // Create
    profile = await ProviderProfile.create({
      user: req.user._id,
      cuisine,
      location,
      pricing,
      imageUrl,
      availability,
      closedDates,
      deliverySlots,
      deliveryTimings,
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all providers
// @route   GET /api/providers
// @access  Public
export const getProviders = async (req, res) => {
  try {
    const { city, cuisine, minRating, maxDeliveryFee, mealType, maxMealPrice, available } = req.query;
    const profileQuery = {};

    if (city) profileQuery['location.city'] = new RegExp(city, 'i');
    if (cuisine) profileQuery.cuisine = { $regex: cuisine, $options: 'i' };
    if (minRating && !Number.isNaN(Number(minRating))) profileQuery.averageRating = { $gte: Number(minRating) };
    if (maxDeliveryFee && !Number.isNaN(Number(maxDeliveryFee))) profileQuery['pricing.deliveryFee'] = { $lte: Number(maxDeliveryFee) };
    if (available === 'true') profileQuery.availability = true;

    const providers = (await ProviderProfile.find(profileQuery).populate('user', 'name email providerApprovalStatus isBlocked'))
      .filter((provider) => (
        provider.user
        && provider.user.providerApprovalStatus === 'approved'
        && !provider.user.isBlocked
      ));
    const providerIds = providers.map((provider) => provider.user?._id).filter(Boolean);
    const mealQuery = { provider: { $in: providerIds }, isActive: true };

    if (mealType) mealQuery.type = mealType;
    if (maxMealPrice && !Number.isNaN(Number(maxMealPrice))) mealQuery.price = { $lte: Number(maxMealPrice) };

    const meals = await MealPlan.find(mealQuery).select('provider price type name');
    const mealStatsByProvider = meals.reduce((stats, meal) => {
      const key = meal.provider.toString();
      const current = stats[key] || {
        mealCount: 0,
        minMealPrice: meal.price,
        maxMealPrice: meal.price,
        mealTypes: new Set(),
      };

      current.mealCount += 1;
      current.minMealPrice = Math.min(current.minMealPrice, meal.price);
      current.maxMealPrice = Math.max(current.maxMealPrice, meal.price);
      current.mealTypes.add(meal.type);
      stats[key] = current;
      return stats;
    }, {});

    const filteredProviders = providers
      .filter((provider) => {
        if (!mealType && !maxMealPrice) return true;
        return mealStatsByProvider[provider.user._id.toString()]?.mealCount > 0;
      })
      .map((provider) => {
        const stats = mealStatsByProvider[provider.user._id.toString()];
        return {
          ...provider.toObject(),
          mealStats: stats ? {
            mealCount: stats.mealCount,
            minMealPrice: stats.minMealPrice,
            maxMealPrice: stats.maxMealPrice,
            mealTypes: Array.from(stats.mealTypes),
          } : {
            mealCount: 0,
            minMealPrice: 0,
            maxMealPrice: 0,
            mealTypes: [],
          },
        };
      });

    res.json(filteredProviders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get provider by ID
// @route   GET /api/providers/:id
// @access  Public
export const getProviderById = async (req, res) => {
  try {
    const provider = await ProviderProfile.findOne({
      $or: [{ _id: req.params.id }, { user: req.params.id }],
    }).populate('user', 'name email');
    if (provider) {
      res.json(provider);
    } else {
      res.status(404).json({ message: 'Provider not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get provider dashboard analytics
// @route   GET /api/providers/analytics/summary
// @access  Private/Provider
export const getProviderAnalytics = async (req, res) => {
  try {
    const orders = await Order.find({ provider: req.user._id }).populate('mealPlan', 'name price');
    const todayKey = new Date().toISOString().slice(0, 10);
    const activeStatuses = ['pending', 'accepted', 'preparing'];
    const activeOrders = orders.filter((order) => activeStatuses.includes(order.status));
    const activeRoutines = activeOrders.filter((order) => order.subscriptionType !== 'one-time').length;
    const todayOrders = orders.filter((order) => (
      order.createdAt?.toISOString().slice(0, 10) === todayKey
      || order.orderSchedule?.some((item) => (
        item.status === 'scheduled' && new Date(item.date).toISOString().slice(0, 10) === todayKey
      ))
    )).length;
    const monthlyEstimate = activeOrders.reduce((sum, order) => sum + (order.monthlyBill || order.totalPrice || 0), 0);
    const mealCounts = orders.reduce((counts, order) => {
      const mealName = order.mealPlan?.name || 'Deleted Plan';
      counts[mealName] = (counts[mealName] || 0) + 1;
      return counts;
    }, {});
    const topMeal = Object.entries(mealCounts).sort((a, b) => b[1] - a[1])[0];

    res.json({
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      activeRoutines,
      todayOrders,
      monthlyEstimate,
      topMeal: topMeal ? { name: topMeal[0], count: topMeal[1] } : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get today's provider prep sheet
// @route   GET /api/providers/prep-sheet/today
// @access  Private/Provider
export const getTodayPrepSheet = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      provider: req.user._id,
      status: { $in: ['pending', 'accepted', 'preparing'] },
      $or: [
        { subscriptionType: 'one-time', createdAt: { $gte: today, $lt: tomorrow } },
        { orderSchedule: { $elemMatch: { date: { $gte: today, $lt: tomorrow }, status: 'scheduled' } } },
      ],
    })
      .populate('customer', 'name email')
      .populate('mealPlan', 'name items type');

    const summary = orders.reduce((items, order) => {
      const key = order.mealPlan?._id?.toString() || 'deleted';
      const current = items[key] || {
        mealPlanId: key,
        name: order.mealPlan?.name || 'Deleted Plan',
        type: order.mealPlan?.type || 'unknown',
        items: order.mealPlan?.items || [],
        count: 0,
        slots: {},
      };

      current.count += 1;
      const slot = order.deliverySlot || 'Slot not set';
      current.slots[slot] = (current.slots[slot] || 0) + 1;
      items[key] = current;
      return items;
    }, {});

    res.json({
      date: today,
      totalOrders: orders.length,
      summary: Object.values(summary),
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
