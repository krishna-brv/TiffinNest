import mongoose from 'mongoose';

const providerProfileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    cuisine: {
      type: [String],
      required: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    pricing: {
      deliveryFee: { type: Number, default: 0 },
    },
    availability: {
      type: Boolean,
      default: true,
    },
    deliveryTimings: {
      type: String,
      default: '12:00 PM - 2:00 PM',
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);

export default ProviderProfile;
