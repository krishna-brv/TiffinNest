import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Filter, Heart, IndianRupee, MapPin, Search, Star } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useProviderStore from '../store/providerStore';
import useUIStore from '../store/uiStore';

const ProvidersList = () => {
  const navigate = useNavigate();
  const { providers, loading, error, fetchProviders } = useProviderStore();
  const { user, toggleFavoriteProvider } = useAuthStore();
  const { addToast } = useUIStore();
  const [filters, setFilters] = useState({
    city: '',
    cuisine: '',
    mealType: '',
    maxMealPrice: '',
    minRating: '',
    available: true,
    favoritesOnly: false,
  });

  useEffect(() => {
    fetchProviders({
      city: filters.city,
      cuisine: filters.cuisine,
      mealType: filters.mealType,
      maxMealPrice: filters.maxMealPrice,
      minRating: filters.minRating,
      available: filters.available ? 'true' : '',
    });
  }, [fetchProviders, filters.available, filters.city, filters.cuisine, filters.maxMealPrice, filters.mealType, filters.minRating]);

  const favoriteIds = useMemo(() => (
    new Set((user?.favoriteProviders || []).map((id) => id.toString()))
  ), [user?.favoriteProviders]);

  const visibleProviders = filters.favoritesOnly
    ? providers.filter((provider) => favoriteIds.has(provider.user?._id))
    : providers;

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleToggleFavorite = async (providerId) => {
    try {
      const result = await toggleFavoriteProvider(providerId);
      addToast(result.isFavorite ? 'Added to favorites.' : 'Removed from favorites.', 'success');
    } catch (err) {
      addToast(err, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6 border-b border-white/20 pb-4">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-900">
            Available Providers
          </h1>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/50 hover:bg-white/80 text-gray-800 rounded-lg shadow transition">
            Back
          </button>
        </div>

        <div className="mb-8 rounded-2xl bg-white/70 border border-white/80 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-slate-600">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <label className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input className="glass-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-950" placeholder="City" value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} />
            </label>
            <input className="glass-input rounded-xl px-3 py-2.5 text-sm text-slate-950" placeholder="Cuisine" value={filters.cuisine} onChange={(e) => updateFilter('cuisine', e.target.value)} />
            <select className="glass-input rounded-xl px-3 py-2.5 text-sm text-slate-950" value={filters.mealType} onChange={(e) => updateFilter('mealType', e.target.value)}>
              <option value="">Any diet</option>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-veg</option>
              <option value="vegan">Vegan</option>
            </select>
            <input type="number" min="1" className="glass-input rounded-xl px-3 py-2.5 text-sm text-slate-950" placeholder="Max meal Rs." value={filters.maxMealPrice} onChange={(e) => updateFilter('maxMealPrice', e.target.value)} />
            <select className="glass-input rounded-xl px-3 py-2.5 text-sm text-slate-950" value={filters.minRating} onChange={(e) => updateFilter('minRating', e.target.value)}>
              <option value="">Any rating</option>
              <option value="3">3+ stars</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => updateFilter('available', !filters.available)} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${filters.available ? 'bg-teal-600 text-white' : 'bg-white text-slate-700'}`}>
                Open
              </button>
              <button type="button" onClick={() => updateFilter('favoritesOnly', !filters.favoritesOnly)} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${filters.favoritesOnly ? 'bg-rose-500 text-white' : 'bg-white text-slate-700'}`}>
                Faves
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-800">Loading providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 glass-panel">{error}</div>
        ) : visibleProviders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-800 text-lg">No providers match these filters yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProviders.map((provider) => {
              const providerId = provider.user?._id;
              const isFavorite = favoriteIds.has(providerId);

              return (
                <div key={provider._id} className="glass-panel overflow-hidden rounded-2xl hover:scale-[1.02] transition-transform duration-300">
                  <div className="h-36 bg-slate-100">
                    {provider.imageUrl ? (
                      <img src={provider.imageUrl} alt={provider.user?.name || 'Kitchen'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-teal-100">
                        <ChefHat className="w-10 h-10 text-teal-700" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ChefHat className="w-6 h-6 mr-2 text-indigo-600" />
                        {provider.user?.name || 'Chef'}
                      </h2>
                      <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
                        <span className="text-sm font-bold text-yellow-700">{provider.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-gray-700 mb-4">
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        {provider.location?.city || 'Local'}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">Cuisine:</span> {provider.cuisine?.join(', ') || 'Home style'}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">Delivery Fee:</span> Rs. {provider.pricing?.deliveryFee || 0}
                      </p>
                      <p className="text-sm flex items-center">
                        <IndianRupee className="w-4 h-4 mr-1 text-slate-500" />
                        Meals from Rs. {provider.mealStats?.minMealPrice || 0}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(provider.deliverySlots || []).slice(0, 2).map((slot) => (
                          <span key={slot} className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">{slot}</span>
                        ))}
                        {provider.availability === false && <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">Closed</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`rounded-xl px-3 py-2 shadow transition ${isFavorite ? 'bg-rose-500 text-white' : 'bg-white text-slate-700'}`}
                        onClick={() => handleToggleFavorite(providerId)}
                        title="Toggle favorite"
                      >
                        <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button 
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
                        onClick={() => navigate(`/customer/provider/${providerId}`)}
                      >
                        View Menu
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvidersList;
