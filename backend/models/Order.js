import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'MealPlan',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'preparing', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    deliverySlot: {
      type: String,
      default: '12:00 PM - 2:00 PM',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    monthlyBill: {
      type: Number,
      default: 0,
    },
    subscriptionType: {
      type: String,
      enum: ['one-time', 'daily', 'weekly', 'monthly'],
      default: 'one-time',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    orderSchedule: [
      {
        date: { type: Date, required: true },
        status: {
          type: String,
          enum: ['scheduled', 'skipped', 'delivered', 'paused'],
          default: 'scheduled',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
