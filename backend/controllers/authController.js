import User from '../models/User.js';
import Order from '../models/Order.js';
import MealPlan from '../models/MealPlan.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Review from '../models/Review.js';
import jwt from 'jsonwebtoken';
import generateToken, { generateRefreshToken } from '../utils/generateToken.js';
import { validationResult } from 'express-validator';
import crypto from 'crypto';

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  favoriteProviders: user.favoriteProviders || [],
  addressBook: user.addressBook || [],
  token: generateToken(user._id),
  refreshToken: generateRefreshToken(user._id),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, password, role } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
    });

    if (user) {
      res.status(201).json(buildAuthResponse(user));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json(buildAuthResponse(user));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Refresh token user not found' });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(401).json({ message: 'Refresh token is invalid or expired' });
  }
};

// @desc    Request a password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'If an account exists for this email, a password reset token has been created.',
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Password reset token created. Use it within 15 minutes.',
      resetToken,
      resetUrl: `/login?resetToken=${resetToken}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Reset token and new password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        favoriteProviders: user.favoriteProviders || [],
        addressBook: user.addressBook || [],
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle a provider in customer favorites
// @route   PUT /api/auth/favorites/:providerId
// @access  Private
export const toggleFavoriteProvider = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const provider = await User.findById(req.params.providerId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const alreadyFavorite = user.favoriteProviders.some((id) => (
      id.toString() === req.params.providerId
    ));

    if (alreadyFavorite) {
      user.favoriteProviders = user.favoriteProviders.filter((id) => (
        id.toString() !== req.params.providerId
      ));
    } else {
      user.favoriteProviders.push(provider._id);
    }

    await user.save();

    res.json({
      favoriteProviders: user.favoriteProviders,
      isFavorite: !alreadyFavorite,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update logged in user's profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name.trim();
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      favoriteProviders: updatedUser.favoriteProviders || [],
      addressBook: updatedUser.addressBook || [],
      token: generateToken(updatedUser._id),
      refreshToken: generateRefreshToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save logged in user's address book
// @route   PUT /api/auth/address-book
// @access  Private
export const updateAddressBook = async (req, res) => {
  const { addressBook } = req.body;

  if (!Array.isArray(addressBook)) {
    return res.status(400).json({ message: 'Address book must be a list' });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addressBook = addressBook
      .map((item) => ({
        label: item.label?.trim(),
        address: item.address?.trim(),
        city: item.city?.trim(),
        zipCode: item.zipCode?.trim(),
      }))
      .filter((item) => item.label && item.address && item.city && item.zipCode);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      favoriteProviders: updatedUser.favoriteProviders || [],
      addressBook: updatedUser.addressBook || [],
      token: generateToken(updatedUser._id),
      refreshToken: generateRefreshToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change logged in user's password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatches = await user.matchPassword(currentPassword);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete logged in user's account
// @route   DELETE /api/auth/profile
// @access  Private
export const deleteUserAccount = async (req, res) => {
  const { currentPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ message: 'Current password is required to delete your account' });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatches = await user.matchPassword(currentPassword);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await User.updateMany(
      { favoriteProviders: user._id },
      { $pull: { favoriteProviders: user._id } }
    );

    await MealPlan.updateMany(
      { 'reviews.user': user._id },
      { $pull: { reviews: { user: user._id } } }
    );

    if (user.role === 'provider') {
      await ProviderProfile.deleteOne({ user: user._id });
      await MealPlan.deleteMany({ provider: user._id });
      await Order.deleteMany({ provider: user._id });
      await Review.deleteMany({ provider: user._id });
    }

    await Order.deleteMany({ customer: user._id });
    await Review.deleteMany({ customer: user._id });
    await user.deleteOne();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
