import User from '../models/User.js';
import Order from '../models/Order.js';
import MealPlan from '../models/MealPlan.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Complaint from '../models/Complaint.js';

const orderStatuses = ['pending', 'preparing', 'delivered', 'cancelled'];
const providerStatuses = ['pending', 'approved', 'rejected'];

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 5), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const sendPage = async (res, model, filter, query, options = {}) => {
  const { page, limit, skip } = getPagination(query);
  const [data, total] = await Promise.all([
    model.find(filter)
      .select(options.select || '')
      .populate(options.populate || [])
      .sort(options.sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    model.countDocuments(filter),
  ]);

  res.json({
    data,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    total,
    limit,
  });
};

const findUserIds = async (search) => {
  if (!search?.trim()) return [];
  const regex = new RegExp(escapeRegex(search.trim()), 'i');
  const users = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id');
  return users.map((user) => user._id);
};

const findMealIds = async (search) => {
  if (!search?.trim()) return [];
  const regex = new RegExp(escapeRegex(search.trim()), 'i');
  const meals = await MealPlan.find({ name: regex }).select('_id');
  return meals.map((meal) => meal._id);
};

const removeUserData = async (user) => {
  await User.updateMany(
    { favoriteProviders: user._id },
    { $pull: { favoriteProviders: user._id } }
  );

  if (user.role === 'provider') {
    await ProviderProfile.deleteOne({ user: user._id });
    await MealPlan.deleteMany({ provider: user._id });
    await Order.deleteMany({ provider: user._id });
  }

  await Order.deleteMany({ customer: user._id });
  await Complaint.deleteMany({ user: user._id });
  await user.deleteOne();
};

export const getAdminSummary = async (req, res) => {
  try {
    const [totalUsers, totalMeals, totalOrders] = await Promise.all([
      User.countDocuments({}),
      MealPlan.countDocuments({}),
      Order.countDocuments({}),
    ]);

    res.json({ totalUsers, totalMeals, totalOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const { search, role, blocked } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    if (['customer', 'provider', 'admin'].includes(role)) filter.role = role;
    if (blocked === 'true') filter.isBlocked = true;
    if (blocked === 'false') filter.isBlocked = false;

    await sendPage(res, User, filter, req.query, {
      select: '-password -resetPasswordToken -resetPasswordExpires',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserBlock = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot block your own admin account' });
  }

  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = Boolean(req.body.isBlocked);
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own admin account' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    await removeUserData(user);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminMeals = async (req, res) => {
  try {
    const { search, available, type } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      const providerIds = await findUserIds(search);
      filter.$or = [
        { name: regex },
        { description: regex },
        { items: regex },
        { provider: { $in: providerIds } },
      ];
    }

    if (available === 'true') filter.isActive = true;
    if (available === 'false') filter.isActive = false;
    if (['veg', 'non-veg', 'vegan'].includes(type)) filter.type = type;

    await sendPage(res, MealPlan, filter, req.query, {
      populate: [{ path: 'provider', select: 'name email providerApprovalStatus' }],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMealAvailability = async (req, res) => {
  try {
    const meal = await MealPlan.findById(req.params.id).populate('provider', 'name email providerApprovalStatus');

    if (!meal) return res.status(404).json({ message: 'Meal not found' });

    meal.isActive = Boolean(req.body.isActive);
    const updatedMeal = await meal.save();
    await updatedMeal.populate('provider', 'name email providerApprovalStatus');
    res.json(updatedMeal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminMeal = async (req, res) => {
  try {
    const meal = await MealPlan.findById(req.params.id);

    if (!meal) return res.status(404).json({ message: 'Meal not found' });

    await meal.deleteOne();
    res.json({ message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (orderStatuses.includes(status)) filter.status = status;

    if (search?.trim()) {
      const [userIds, mealIds] = await Promise.all([findUserIds(search), findMealIds(search)]);
      filter.$or = [
        { customer: { $in: userIds } },
        { provider: { $in: userIds } },
        { mealPlan: { $in: mealIds } },
      ];
    }

    await sendPage(res, Order, filter, req.query, {
      populate: [
        { path: 'customer', select: 'name email' },
        { path: 'provider', select: 'name email' },
        { path: 'mealPlan', select: 'name price' },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  const { status } = req.body;

  if (!orderStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status' });
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    const updatedOrder = await order.save();
    await updatedOrder.populate('customer', 'name email');
    await updatedOrder.populate('provider', 'name email');
    await updatedOrder.populate('mealPlan', 'name price');

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProviderApprovals = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = { role: 'provider' };

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    if (providerStatuses.includes(status)) filter.providerApprovalStatus = status;

    await sendPage(res, User, filter, req.query, {
      select: '-password -resetPasswordToken -resetPasswordExpires',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProviderApproval = async (req, res) => {
  const { status } = req.body;

  if (!providerStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid provider approval status' });
  }

  try {
    const provider = await User.findOne({ _id: req.params.id, role: 'provider' }).select('-password');

    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    provider.providerApprovalStatus = status;
    const updatedProvider = await provider.save();
    res.json(updatedProvider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminComplaints = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      const userIds = await findUserIds(search);
      filter.$or = [
        { subject: regex },
        { message: regex },
        { user: { $in: userIds } },
      ];
    }

    if (['open', 'resolved'].includes(status)) filter.status = status;

    await sendPage(res, Complaint, filter, req.query, {
      populate: [{ path: 'user', select: 'name email' }],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markComplaintResolved = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('user', 'name email');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'resolved';
    const updatedComplaint = await complaint.save();
    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
