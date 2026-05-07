import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';

// @desc    Create or update provider profile
// @route   POST /api/providers/profile
// @access  Private/Provider
export const upsertProviderProfile = async (req, res) => {
  const { cuisine, location, pricing, availability, deliveryTimings } = req.body;

  try {
    let profile = await ProviderProfile.findOne({ user: req.user._id });

    if (profile) {
      // Update
      profile.cuisine = cuisine || profile.cuisine;
      profile.location = location || profile.location;
      profile.pricing = pricing || profile.pricing;
      profile.availability = availability !== undefined ? availability : profile.availability;
      profile.deliveryTimings = deliveryTimings || profile.deliveryTimings;

      const updatedProfile = await profile.save();
      return res.json(updatedProfile);
    }

    // Create
    profile = await ProviderProfile.create({
      user: req.user._id,
      cuisine,
      location,
      pricing,
      availability,
      deliveryTimings,
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all providers
// @route   GET /api/providers
// @access  Public
export const getProviders = async (req, res) => {
  try {
    const providers = await ProviderProfile.find({}).populate('user', 'name email');
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get provider by ID
// @route   GET /api/providers/:id
// @access  Public
export const getProviderById = async (req, res) => {
  try {
    const provider = await ProviderProfile.findById(req.params.id).populate('user', 'name email');
    if (provider) {
      res.json(provider);
    } else {
      res.status(404).json({ message: 'Provider not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
