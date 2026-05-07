import express from 'express';
import { upsertProviderProfile, getProviders, getProviderById } from '../controllers/providerController.js';
import { protect, provider } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProviders);
router.route('/profile').post(protect, provider, upsertProviderProfile);
router.route('/:id').get(getProviderById);

export default router;
