import Order from '../models/Order.js';
import MealPlan from '../models/MealPlan.js';
import { io } from '../server.js';

const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfCurrentMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const buildOrderSchedule = (subscriptionType, startDate) => {
  const schedule = [];
  const current = startOfDay(startDate);
  const endDate = subscriptionType === 'one-time' ? startOfDay(startDate) : endOfCurrentMonth(current);

  while (current <= endDate) {
    schedule.push({ date: new Date(current), status: 'scheduled' });

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
  const { provider, mealPlan, deliveryAddress, subscriptionType = 'one-time' } = req.body;

  try {
    const selectedMealPlan = await MealPlan.findById(mealPlan);

    if (!selectedMealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
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
    const { schedule, endDate } = buildOrderSchedule(subscriptionType, startDate);
    const monthlyBill = selectedMealPlan.price * schedule.length;

    const order = await Order.create({
      customer: req.user._id,
      provider,
      mealPlan,
      deliveryAddress,
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
  const { deliveryAddress, subscriptionType } = req.body;

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
