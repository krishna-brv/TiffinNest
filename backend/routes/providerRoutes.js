import express from 'express';
import { upsertProviderProfile, getProviders, getProviderById, getProviderAnalytics, getTodayPrepSheet } from '../controllers/providerController.js';
import { protect, provider } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProviders);
router.route('/analytics/summary').get(protect, provider, getProviderAnalytics);
router.route('/prep-sheet/today').get(protect, provider, getTodayPrepSheet);
router.route('/profile').post(protect, provider, upsertProviderProfile);
router.route('/:id').get(getProviderById);

export default router;
