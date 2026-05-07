import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { ChefHat, MapPin, IndianRupee, PlusCircle, Trash2 } from 'lucide-react';

const ProviderPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Profile State
  const [profile, setProfile] = useState({
    cuisine: '',
    address: '',
    city: '',
    zipCode: '',
    deliveryFee: 0,
  });
  const [profileMessage, setProfileMessage] = useState('');

  // Meal Plan State
  const [mealPlans, setMealPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    type: 'veg',
    frequency: 'daily',
    price: 0,
    items: '',
  });
  const [planMessage, setPlanMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Profile (we use a trick to get it by user ID if there's an endpoint, 
        // but since we only have GET /api/providers which gets all, we can filter or 
        // rely on the user to just update it. Wait, we don't have a GET /api/providers/profile 
        // endpoint for the logged in user in the backend. Let's fetch all and find ours.)
        const { data: providers } = await api.get('/providers');
        const myProfile = providers.find(p => p.user._id === user._id || p.user === user._id);
        
        if (myProfile) {
          setProfile({
            cuisine: myProfile.cuisine.join(', '),
            address: myProfile.location?.address || '',
            city: myProfile.location?.city || '',
            zipCode: myProfile.location?.zipCode || '',
            deliveryFee: myProfile.pricing?.deliveryFee || 0,
          });
        }

        // Fetch Meal Plans
        const { data: plans } = await api.get(`/meals/provider/${user._id}`);
        setMealPlans(plans);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    if (user?._id) fetchData();
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/providers/profile', {
        cuisine: profile.cuisine.split(',').map(item => item.trim()),
        location: {
          address: profile.address,
          city: profile.city,
          zipCode: profile.zipCode
        },
        pricing: { deliveryFee: Number(profile.deliveryFee) }
      });
      setProfileMessage('Profile updated successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (error) {
      setProfileMessage(error.response?.data?.message || error.message);
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/meals', {
        ...newPlan,
        price: Number(newPlan.price),
        items: newPlan.items.split(',').map(item => item.trim())
      });
      setMealPlans([...mealPlans, data]);
      setNewPlan({ name: '', description: '', type: 'veg', frequency: 'daily', price: 0, items: '' });
      setPlanMessage('Meal plan added successfully!');
      setTimeout(() => setPlanMessage(''), 3000);
    } catch (error) {
      setPlanMessage(error.response?.data?.message || error.message);
    }
  };

  const deletePlan = async (id) => {
    if(window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await api.delete(`/meals/${id}`);
        setMealPlans(mealPlans.filter(p => p._id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-orange-900">Manage Menu & Profile</h1>
            <p className="text-gray-700">Set up your kitchen details and daily offerings.</p>
          </div>
          <button onClick={() => navigate('/provider/dashboard')} className="px-6 py-2 bg-white/50 hover:bg-white/80 text-gray-800 font-semibold rounded-xl shadow transition">Back</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Settings Form */}
          <div className="lg:col-span-1 glass-panel p-6 md:p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <ChefHat className="w-6 h-6 mr-2 text-orange-600" /> Kitchen Profile
            </h2>
            {profileMessage && <div className="mb-4 p-3 bg-orange-100 text-orange-800 rounded-lg text-sm">{profileMessage}</div>}
            
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800">Cuisine Types (comma separated)</label>
                <input type="text" required className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" placeholder="e.g. Punjabi, South Indian" value={profile.cuisine} onChange={e => setProfile({ ...profile, cuisine: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">City</label>
                <input type="text" required className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Full Address</label>
                <textarea required className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" rows="2" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Zip Code</label>
                <input type="text" required className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" value={profile.zipCode} onChange={e => setProfile({ ...profile, zipCode: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Delivery Fee (₹)</label>
                <input type="number" required min="0" className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" value={profile.deliveryFee} onChange={e => setProfile({ ...profile, deliveryFee: e.target.value })} />
              </div>
              <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-transform hover:-translate-y-0.5">Save Profile</button>
            </form>
          </div>

          {/* Meal Plans Section */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Add New Plan */}
            <div className="glass-panel p-6 md:p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <PlusCircle className="w-6 h-6 mr-2 text-indigo-600" /> Add New Meal Plan
              </h2>
              {planMessage && <div className="mb-4 p-3 bg-indigo-100 text-indigo-800 rounded-lg text-sm">{planMessage}</div>}
              
              <form onSubmit={handlePlanSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800">Plan Name</label>
                  <input type="text" required className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" placeholder="e.g. Basic Veg Lunch" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800">Description</label>
                  <input type="text" required className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" placeholder="Brief description..." value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Diet Type</label>
                  <select className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" value={newPlan.type} onChange={e => setNewPlan({ ...newPlan, type: e.target.value })}>
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Frequency</label>
                  <select className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" value={newPlan.frequency} onChange={e => setNewPlan({ ...newPlan, frequency: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800">Items (comma separated)</label>
                  <input type="text" required className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" placeholder="e.g. 4 Roti, Dal Fry, Rice, Salad" value={newPlan.items} onChange={e => setNewPlan({ ...newPlan, items: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800">Price (₹)</label>
                  <input type="number" required min="1" className="mt-1 block w-full px-4 py-2 glass-input rounded-xl" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} />
                </div>
                <div className="md:col-span-2 mt-2">
                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-transform hover:-translate-y-0.5">Create Meal Plan</button>
                </div>
              </form>
            </div>

            {/* List Existing Plans */}
            <div className="glass-panel p-6 md:p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Active Plans</h2>
              {mealPlans.length === 0 ? (
                <p className="text-gray-600">You haven't created any plans yet.</p>
              ) : (
                <div className="space-y-4">
                  {mealPlans.map((plan) => (
                    <div key={plan._id} className="bg-white/40 border border-white/30 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name} <span className={`text-xs px-2 py-1 rounded-full ${plan.type === 'veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{plan.type}</span></h3>
                        <p className="text-sm text-gray-700 mt-1">{plan.description}</p>
                        <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Items:</span> {plan.items.join(', ')}</p>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center md:flex-col md:items-end gap-4 md:gap-2">
                        <div className="text-lg font-bold text-gray-900 flex items-center">
                          <IndianRupee className="w-4 h-4" />{plan.price} / {plan.frequency}
                        </div>
                        <button onClick={() => deletePlan(plan._id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderPlans;
