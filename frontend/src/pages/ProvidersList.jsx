import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Star, MapPin, ChefHat } from 'lucide-react';

const ProvidersList = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const { data } = await api.get('/providers');
        setProviders(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/20 pb-4">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-900">
            Available Providers
          </h1>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/50 hover:bg-white/80 text-gray-800 rounded-lg shadow transition">
            Back
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-800">Loading providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 glass-panel">
            {error}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-800 text-lg">No providers have registered yet. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div key={provider._id} className="glass-panel p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <ChefHat className="w-6 h-6 mr-2 text-indigo-600" />
                    {provider.user?.name || 'Chef'}
                  </h2>
                  <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
                    <span className="text-sm font-bold text-yellow-700">{provider.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-gray-700 mb-4">
                  <p className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    {provider.location?.city || 'Local'}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">Cuisine:</span> {provider.cuisine?.join(', ')}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">Delivery Fee:</span> ₹{provider.pricing?.deliveryFee || 0}
                  </p>
                </div>

                <button 
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
                  onClick={() => navigate(`/customer/provider/${provider.user._id}`)}
                >
                  View Menu
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvidersList;
