import express from 'express';
import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getProviderOrders,
  getMonthlyBill,
  updateRoutineOrder,
} from '../controllers/orderController.js';
import { protect, provider } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createOrder);
router.route('/myorders').get(protect, getMyOrders);
router.route('/monthly-bill').get(protect, getMonthlyBill);
router.route('/provider').get(protect, provider, getProviderOrders);
router.route('/:id/routine').put(protect, updateRoutineOrder);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, provider, updateOrderStatus);

export default router;
