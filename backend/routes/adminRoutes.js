import express from 'express';
import {
  deleteAdminMeal,
  deleteAdminUser,
  getAdminComplaints,
  getAdminMeals,
  getAdminOrders,
  getAdminSummary,
  getAdminUsers,
  getProviderApprovals,
  markComplaintResolved,
  updateAdminOrderStatus,
  updateMealAvailability,
  updateProviderApproval,
  updateUserBlock,
} from '../controllers/adminController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/summary', getAdminSummary);
router.get('/users', getAdminUsers);
router.patch('/users/:id/block', updateUserBlock);
router.delete('/users/:id', deleteAdminUser);

router.get('/meals', getAdminMeals);
router.patch('/meals/:id/availability', updateMealAvailability);
router.delete('/meals/:id', deleteAdminMeal);

router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateAdminOrderStatus);

router.get('/providers', getProviderApprovals);
router.patch('/providers/:id/approval', updateProviderApproval);

router.get('/complaints', getAdminComplaints);
router.patch('/complaints/:id/resolve', markComplaintResolved);

export default router;
