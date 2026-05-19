import Order from '../models/Order.js';
import MealPlan from '../models/MealPlan.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { io } from '../server.js';

const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfCurrentMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getDateKey = (date) => startOfDay(date).toISOString().slice(0, 10);

const buildOrderSchedule = (subscriptionType, startDate, closedDates = []) => {
  const schedule = [];
  const current = startOfDay(startDate);
  const endDate = subscriptionType === 'one-time' ? startOfDay(startDate) : endOfCurrentMonth(current);
  const closedDateKeys = new Set(closedDates.map((date) => getDateKey(date)));

  while (current <= endDate) {
    if (!closedDateKeys.has(getDateKey(current))) {
      schedule.push({ date: new Date(current), status: 'scheduled' });
    }

    if (subscriptionType === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (subscriptionType === 'monthly') {
      break;
    } else {
      current.setDate(current.getDate() + 1);
    }
  }

  return { schedule, endDate };
};

const getNextOrderDate = (order) => {
  const today = startOfDay(new Date());
  const nextSchedule = order.orderSchedule?.find((item) => (
    item.status === 'scheduled' && startOfDay(item.date) >= today
  ));

  return nextSchedule?.date || null;
};

const hasFutureScheduledOrder = (order) => {
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);

  return order.orderSchedule?.some((item) => (
    item.status === 'scheduled' && startOfDay(item.date) >= tomorrow
  ));
};

const findScheduledRoutine = async ({ customer, provider, mealPlan }) => {
  const today = startOfDay(new Date());

  return Order.findOne({
    customer,
    provider,
    mealPlan,
    subscriptionType: { $ne: 'one-time' },
    status: { $nin: ['rejected', 'cancelled', 'delivered'] },
    orderSchedule: {
      $elemMatch: {
        date: { $gte: today },
        status: 'scheduled',
      },
    },
  });
};

const rebuildRoutineSchedule = (order, subscriptionType, startDate) => {
  const today = startOfDay(startDate);
  const keptHistory = order.orderSchedule.filter((item) => startOfDay(item.date) < today);
  const { schedule, endDate } = buildOrderSchedule(subscriptionType, today);

  order.orderSchedule = [...keptHistory, ...schedule];
  order.endDate = endDate;
  order.monthlyBill = order.totalPrice * order.orderSchedule.filter((item) => item.status !== 'skipped').length;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
export const createOrder = async (req, res) => {
  const { provider, mealPlan, deliveryAddress, deliverySlot, subscriptionType = 'one-time' } = req.body;

  try {
    const selectedMealPlan = await MealPlan.findById(mealPlan);

    if (!selectedMealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    const providerProfile = await ProviderProfile.findOne({ user: provider });
    if (providerProfile && !providerProfile.availability) {
      return res.status(400).json({ message: 'This provider is currently unavailable' });
    }

    if (providerProfile?.deliverySlots?.length && deliverySlot && !providerProfile.deliverySlots.includes(deliverySlot)) {
      return res.status(400).json({ message: 'Selected delivery slot is not available' });
    }

    const existingRoutine = await findScheduledRoutine({
      customer: req.user._id,
      provider,
      mealPlan,
    });

    if (existingRoutine) {
      return res.status(409).json({
        message: 'This meal is already in your routine. Please edit the existing routine instead.',
        existingOrderId: existingRoutine._id,
      });
    }

    const startDate = startOfDay(new Date());
    const { schedule, endDate } = buildOrderSchedule(subscriptionType, startDate, providerProfile?.closedDates || []);

    if (schedule.length === 0) {
      return res.status(400).json({ message: 'No delivery dates are available for this routine right now' });
    }

    const monthlyBill = selectedMealPlan.price * schedule.length;

    const order = await Order.create({
      customer: req.user._id,
      provider,
      mealPlan,
      deliveryAddress,
      deliverySlot: deliverySlot || providerProfile?.deliverySlots?.[0] || '12:00 PM - 2:00 PM',
      totalPrice: selectedMealPlan.price,
      monthlyBill,
      subscriptionType,
      startDate,
      endDate,
      orderSchedule: schedule,
    });

    // Notify provider via socket
    io.emit(`new-order-${provider}`, order);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer routine order
// @route   PUT /api/orders/:id/routine
// @access  Private/Customer
export const updateRoutineOrder = async (req, res) => {
  const { deliveryAddress, deliverySlot, subscriptionType } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.subscriptionType === 'one-time') {
      return res.status(400).json({ message: 'Only routine orders can be edited here' });
    }

    if (deliveryAddress) {
      order.deliveryAddress = deliveryAddress;
    }

    if (deliverySlot) {
      const providerProfile = await ProviderProfile.findOne({ user: order.provider });
      if (providerProfile?.deliverySlots?.length && !providerProfile.deliverySlots.includes(deliverySlot)) {
        return res.status(400).json({ message: 'Selected delivery slot is not available' });
      }
      order.deliverySlot = deliverySlot;
    }

    if (subscriptionType && subscriptionType !== order.subscriptionType) {
      if (subscriptionType === 'one-time') {
        return res.status(400).json({ message: 'Use routine types only when editing an existing routine' });
      }

      order.subscriptionType = subscriptionType;
      rebuildRoutineSchedule(order, subscriptionType, new Date());
    }

    const updatedOrder = await order.save();

    io.emit(`order-status-${order.provider}`, updatedOrder);

    res.json({
      ...updatedOrder.toObject(),
      nextOrderDate: getNextOrderDate(updatedOrder),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pause a routine order for a date range
// @route   PUT /api/orders/:id/pause
// @access  Private/Customer
export const pauseRoutineOrder = async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.subscriptionType === 'one-time') {
      return res.status(400).json({ message: 'Only routine orders can be paused' });
    }

    const pauseStart = startOfDay(startDate || new Date());
    const pauseEnd = startOfDay(endDate || startDate || new Date());

    if (pauseEnd < pauseStart) {
      return res.status(400).json({ message: 'Pause end date cannot be before start date' });
    }

    let pausedCount = 0;
    order.orderSchedule.forEach((item) => {
      const date = startOfDay(item.date);
      if (item.status === 'scheduled' && date >= pauseStart && date <= pauseEnd) {
        item.status = 'paused';
        pausedCount += 1;
      }
    });

    if (!pausedCount) {
      return res.status(400).json({ message: 'No scheduled deliveries found in this date range' });
    }

    order.monthlyBill = order.totalPrice * order.orderSchedule.filter((item) => (
      item.status === 'scheduled' || item.status === 'delivered'
    )).length;

    const updatedOrder = await order.save();
    io.emit(`order-status-${order.provider}`, updatedOrder);

    res.json({
      ...updatedOrder.toObject(),
      nextOrderDate: getNextOrderDate(updatedOrder),
      pausedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resume paused deliveries on a routine order
// @route   PUT /api/orders/:id/resume
// @access  Private/Customer
export const resumeRoutineOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.subscriptionType === 'one-time') {
      return res.status(400).json({ message: 'Only routine orders can be resumed' });
    }

    const today = startOfDay(new Date());
    let resumedCount = 0;

    order.orderSchedule.forEach((item) => {
      if (item.status === 'paused' && startOfDay(item.date) >= today) {
        item.status = 'scheduled';
        resumedCount += 1;
      }
    });

    if (!resumedCount) {
      return res.status(400).json({ message: 'No upcoming paused deliveries found' });
    }

    order.status = ['cancelled', 'delivered'].includes(order.status) ? 'accepted' : order.status;
    order.monthlyBill = order.totalPrice * order.orderSchedule.filter((item) => (
      item.status === 'scheduled' || item.status === 'delivered'
    )).length;

    const updatedOrder = await order.save();
    io.emit(`order-status-${order.provider}`, updatedOrder);

    res.json({
      ...updatedOrder.toObject(),
      nextOrderDate: getNextOrderDate(updatedOrder),
      resumedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Skip the next scheduled routine delivery
// @route   PUT /api/orders/:id/skip-next
// @access  Private/Customer
export const skipNextRoutineOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.subscriptionType === 'one-time') {
      return res.status(400).json({ message: 'Only routine orders can skip scheduled deliveries' });
    }

    const today = startOfDay(new Date());
    const nextSchedule = order.orderSchedule
      .filter((item) => item.status === 'scheduled' && startOfDay(item.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    if (!nextSchedule) {
      return res.status(400).json({ message: 'No upcoming scheduled delivery to skip' });
    }

    nextSchedule.status = 'skipped';
    order.monthlyBill = order.totalPrice * order.orderSchedule.filter((item) => (
      item.status === 'scheduled' || item.status === 'delivered'
    )).length;
    order.status = hasFutureScheduledOrder(order) ? order.status : 'cancelled';

    const updatedOrder = await order.save();

    io.emit(`order-status-${order.provider}`, updatedOrder);

    res.json({
      ...updatedOrder.toObject(),
      nextOrderDate: getNextOrderDate(updatedOrder),
      skippedDate: nextSchedule.date,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a customer order or routine
// @route   PUT /api/orders/:id/cancel
// @access  Private/Customer
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (['delivered', 'cancelled', 'rejected'].includes(order.status)) {
      return res.status(400).json({ message: 'This order cannot be cancelled now' });
    }

    const today = startOfDay(new Date());
    order.status = 'cancelled';
    order.orderSchedule.forEach((item) => {
      if (item.status === 'scheduled' && startOfDay(item.date) >= today) {
        item.status = 'skipped';
      }
    });
    order.monthlyBill = order.totalPrice * order.orderSchedule.filter((item) => item.status === 'delivered').length;

    const updatedOrder = await order.save();

    io.emit(`order-status-${order.provider}`, updatedOrder);

    res.json({
      ...updatedOrder.toObject(),
      nextOrderDate: getNextOrderDate(updatedOrder),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('provider', 'name email')
      .populate('mealPlan', 'name type');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Provider
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (order.provider.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      const nextStatus = req.body.status || order.status;

      if (nextStatus === 'delivered' && order.subscriptionType !== 'one-time') {
        const today = startOfDay(new Date());
        const todaySchedule = order.orderSchedule.find((item) => (
          item.status === 'scheduled' && startOfDay(item.date).getTime() === today.getTime()
        ));

        if (todaySchedule) {
          todaySchedule.status = 'delivered';
        }

        order.status = hasFutureScheduledOrder(order) ? 'accepted' : 'delivered';
      } else {
        order.status = nextStatus;
      }

      const updatedOrder = await order.save();

      // Notify customer via socket
      io.emit(`order-status-${order.customer}`, updatedOrder);

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in customer orders
// @route   GET /api/orders/myorders
// @access  Private/Customer
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('provider', 'name')
      .populate('mealPlan', 'name type price');
    res.json(orders.map((order) => ({
      ...order.toObject(),
      nextOrderDate: getNextOrderDate(order),
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly bill for logged in customer
// @route   GET /api/orders/monthly-bill
// @access  Private/Customer
export const getMonthlyBill = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth();
    const year = Number(req.query.year) || new Date().getFullYear();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      customer: req.user._id,
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    }).populate('provider', 'name').populate('mealPlan', 'name price');

    const items = orders.map((order) => {
      const billableDays = order.orderSchedule.filter((item) => {
        const date = new Date(item.date);
        return item.status === 'delivered' && date >= monthStart && date <= monthEnd;
      }).length;

      return {
        orderId: order._id,
        mealPlan: order.mealPlan?.name || 'Deleted Plan',
        provider: order.provider?.name || 'Unknown',
        pricePerOrder: order.totalPrice,
        billableDays,
        amount: order.totalPrice * billableDays,
      };
    });

    res.json({
      month,
      year,
      total: items.reduce((sum, item) => sum + item.amount, 0),
      items,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in provider orders
// @route   GET /api/orders/provider
// @access  Private/Provider
export const getProviderOrders = async (req, res) => {
  try {
    const orders = await Order.find({ provider: req.user._id })
      .populate('customer', 'name email')
      .populate('mealPlan', 'name type price');
    res.json(orders.map((order) => ({
      ...order.toObject(),
      nextOrderDate: getNextOrderDate(order),
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
