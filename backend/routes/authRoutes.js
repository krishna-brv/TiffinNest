import express from 'express';
import { body } from 'express-validator';
import { registerUser, authUser, getUserProfile, updateUserProfile, changePassword, toggleFavoriteProvider, forgotPassword, resetPassword, deleteUserAccount, updateAddressBook } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  authUser
);

router.post('/forgot-password', [body('email', 'Please include a valid email').isEmail()], forgotPassword);
router.post(
  '/reset-password',
  [
    body('token', 'Reset token is required').not().isEmpty(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  resetPassword
);

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile).delete(protect, deleteUserAccount);
router.route('/password').put(protect, changePassword);
router.route('/favorites/:providerId').put(protect, toggleFavoriteProvider);
router.route('/address-book').put(protect, updateAddressBook);

export default router;
