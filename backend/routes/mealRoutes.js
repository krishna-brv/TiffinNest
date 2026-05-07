import express from 'express';
import {
  createMealPlan,
  getProviderMealPlans,
  updateMealPlan,
  deleteMealPlan,
  getMealsByProvider,
  createMealReview,
} from '../controllers/mealController.js';
import { protect, provider, customerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, provider, createMealPlan);
router.route('/provider/:providerId').get(getProviderMealPlans);
router.route('/provider/:id').get(getMealsByProvider);
router.route('/:id/reviews').post(protect, customerOnly, createMealReview);
router
  .route('/:id')
  .put(protect, provider, updateMealPlan)
  .delete(protect, provider, deleteMealPlan);

export default router;
