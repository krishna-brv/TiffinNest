import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IndianRupee, MapPin, CheckCircle, Package, Clock, Calculator, ChefHat } from 'lucide-react';
import useAuthStore from '../store/authStore';

const ProviderMenu = () => {
  const { id } = useParams(); // Provider User ID
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [mealPlans, setMealPlans] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Ordering State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({ address: '', city: '', zipCode: '' });
  const [deliverySlot, setDeliverySlot] = useState('12:00 PM - 2:00 PM');
  const [subscriptionType, setSubscriptionType] = useState('daily');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');

  const getRoutineCount = (type) => {
    if (type === 'one-time' || type === 'monthly') return 1;
    const today = new Date();
    const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
    return type === 'weekly' ? Math.ceil(daysLeft / 7) : daysLeft;
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [{ data: plans }, { data: orders }, { data: profile }] = await Promise.all([
          api.get(`/meals/provider/${id}`),
          api.get('/orders/myorders'),
          api.get(`/providers/${id}`),
        ]);
        setMealPlans(plans.filter((plan) => plan.isActive !== false));
        setMyOrders(orders);
        setProviderProfile(profile);
        setDeliverySlot(profile.deliverySlots?.[0] || profile.deliveryTimings || '12:00 PM - 2:00 PM');
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchMenu();
  }, [id]);

  const getExistingRoutine = (planId) => myOrders.find((order) => {
    const mealPlanId = order.mealPlan?._id || order.mealPlan;
    const hasFutureScheduledDay = order.orderSchedule?.some((item) => (
      item.status === 'scheduled' && new Date(item.date) >= new Date(new Date().setHours(0, 0, 0, 0))
    ));

    const providerId = order.provider?._id || order.provider;

    return mealPlanId === planId
      && providerId === id
      && order.subscriptionType !== 'one-time'
      && hasFutureScheduledDay
      && !['rejected', 'cancelled', 'delivered'].includes(order.status);
  });

  const selectPlan = (plan) => {
    if (plan.isActive === false) return;

    const existingRoutine = getExistingRoutine(plan._id);

    setSelectedPlan(plan);
    setOrderSuccess('');

    if (existingRoutine) {
      setDeliveryAddress(existingRoutine.deliveryAddress || { address: '', city: '', zipCode: '' });
      setDeliverySlot(existingRoutine.deliverySlot || providerProfile?.deliverySlots?.[0] || '12:00 PM - 2:00 PM');
      setSubscriptionType(existingRoutine.subscriptionType);
      return;
    }

    setDeliveryAddress({ address: '', city: '', zipCode: '' });
    setDeliverySlot(providerProfile?.deliverySlots?.[0] || providerProfile?.deliveryTimings || '12:00 PM - 2:00 PM');
    setSubscriptionType(plan.frequency);
  };

  const applySavedAddress = (addressId) => {
    const savedAddress = user?.addressBook?.find((item) => item._id === addressId);
    if (!savedAddress) return;
    setDeliveryAddress({
      address: savedAddress.address,
      city: savedAddress.city,
      zipCode: savedAddress.zipCode,
    });
  };

  const handleOrder = async (e) => {
    e.preventDefault();

    if (!selectedPlan || selectedPlan.isActive === false) {
      alert('This meal is currently unavailable.');
      return;
    }

    setOrderLoading(true);
    try {
      const existingRoutine = getExistingRoutine(selectedPlan._id);

      if (existingRoutine) {
        await api.put(`/orders/${existingRoutine._id}/routine`, {
          deliveryAddress,
          deliverySlot,
          subscriptionType,
        });
        setOrderSuccess('Routine updated successfully! Redirecting to My Orders...');
      } else {
        await api.post('/orders', {
          provider: id,
          mealPlan: selectedPlan._id,
          deliveryAddress,
          deliverySlot,
          subscriptionType: subscriptionType
        });
        setOrderSuccess('Order placed successfully! Redirecting to My Orders...');
      }

      setOrderLoading(false);
      setTimeout(() => {
        navigate('/customer/orders');
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      setOrderLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page-panel">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8 border-b border-slate-200 pb-4">
          <div className="flex gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-teal-50 shrink-0">
              {providerProfile?.imageUrl ? (
                <img src={providerProfile.imageUrl} alt={providerProfile.user?.name || 'Kitchen'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ChefHat className="w-8 h-8 text-teal-700" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 flex items-center">
                <Package className="w-8 h-8 mr-3 text-teal-600" />
                {providerProfile?.user?.name || 'Provider'} Menu
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {(providerProfile?.deliverySlots || []).join(', ') || providerProfile?.deliveryTimings || 'Delivery slots available'}
              </p>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="action-button bg-white hover:bg-slate-50 text-gray-800">
            Back
          </button>
        </div>

        {providerProfile?.availability === false && (
          <div className="mb-8 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            This kitchen is currently not accepting new orders.
          </div>
        )}

        {orderSuccess && (
          <div className="mb-8 p-4 bg-green-100 text-green-800 rounded-xl flex items-center border border-green-200 shadow-sm animate-pulse">
            <CheckCircle className="w-6 h-6 mr-2" />
            <span className="font-semibold text-lg">{orderSuccess}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-800">Loading delicious meals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 glass-panel">{error}</div>
        ) : mealPlans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-800 text-lg">This provider hasn't added any meal plans yet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealPlans.map((plan) => (
              <div key={plan._id} className={`food-card p-6 ${selectedPlan?._id === plan._id ? 'ring-4 ring-teal-400' : ''}`}>
                {getExistingRoutine(plan._id) && (
                  <div className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Already in your routine
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${plan.type === 'veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {plan.type.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 h-10 line-clamp-2">{plan.description}</p>
                
                <div className="bg-white/40 rounded-xl p-3 mb-4 h-24 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Items Included:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {plan.items.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div className="text-xl font-extrabold text-indigo-700 flex items-center">
                    <IndianRupee className="w-5 h-5" />{plan.price} <span className="text-sm font-normal text-gray-500 ml-1">/ {plan.frequency}</span>
                  </div>
                </div>

                <div className="mb-4 rounded-xl bg-white/50 border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Rating</p>
                    <p className="text-sm font-extrabold text-amber-700">{plan.rating?.toFixed?.(1) || '0.0'} / 5</p>
                  </div>
                  {plan.reviews?.length > 0 ? (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                      "{plan.reviews[plan.reviews.length - 1].comment}" - {plan.reviews[plan.reviews.length - 1].name}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No reviews yet.</p>
                  )}
                </div>

                {selectedPlan?._id === plan._id ? (
                  <form onSubmit={handleOrder} className="mt-4 animate-fade-in">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-800 mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" /> Delivery Address
                      </label>
                      {user?.addressBook?.length > 0 && (
                        <select
                          className="w-full px-3 py-2 glass-input rounded-lg text-sm mb-2"
                          defaultValue=""
                          onChange={(event) => applySavedAddress(event.target.value)}
                        >
                          <option value="" disabled>Use saved address</option>
                          {user.addressBook.map((item) => (
                            <option key={item._id} value={item._id}>{item.label} - {item.city}</option>
                          ))}
                        </select>
                      )}
                      <textarea 
                        required 
                        rows="2"
                        className="w-full px-3 py-2 glass-input rounded-lg text-sm mb-2"
                        placeholder="Enter full street address..."
                        value={deliveryAddress.address}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <input 
                          required type="text" className="w-1/2 px-3 py-2 glass-input rounded-lg text-sm" placeholder="City"
                          value={deliveryAddress.city} onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                        />
                        <input 
                          required type="text" className="w-1/2 px-3 py-2 glass-input rounded-lg text-sm" placeholder="Zip Code"
                          value={deliveryAddress.zipCode} onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-800 mb-1 flex items-center">
                        <Clock className="w-4 h-4 mr-1" /> Routine
                      </label>
                      <select
                        className="w-full px-3 py-2 glass-input rounded-lg text-sm cursor-pointer"
                        value={subscriptionType}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                      >
                        {!getExistingRoutine(selectedPlan._id) && <option value="one-time">One-time</option>}
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-800 mb-1 flex items-center">
                        <Clock className="w-4 h-4 mr-1" /> Delivery Slot
                      </label>
                      <select
                        className="w-full px-3 py-2 glass-input rounded-lg text-sm cursor-pointer"
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                      >
                        {(providerProfile?.deliverySlots?.length ? providerProfile.deliverySlots : ['12:00 PM - 2:00 PM']).map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 p-3">
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-700" />
                        {getExistingRoutine(selectedPlan._id) ? 'Updated routine estimate' : 'Estimated monthly bill'}: Rs. {selectedPlan.price * getRoutineCount(subscriptionType)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {getRoutineCount(subscriptionType)} order{getRoutineCount(subscriptionType) > 1 ? 's' : ''} will be scheduled through this month.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setSelectedPlan(null)}
                        className="w-1/3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={orderLoading || providerProfile?.availability === false}
                        className="w-2/3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex justify-center items-center"
                      >
                        {orderLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : getExistingRoutine(selectedPlan._id) ? 'Update Routine' : 'Confirm Order'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => selectPlan(plan)}
                    disabled={providerProfile?.availability === false}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
                  >
                    {getExistingRoutine(plan._id) ? 'Edit Routine' : 'Subscribe / Order'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderMenu;
