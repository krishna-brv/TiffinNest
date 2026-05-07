import express from 'express';
import { body } from 'express-validator';
import { registerUser, authUser, getUserProfile, updateUserProfile, changePassword } from '../controllers/authController.js';
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

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/password').put(protect, changePassword);

export default router;
