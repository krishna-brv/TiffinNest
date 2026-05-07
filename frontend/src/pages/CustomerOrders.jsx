import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Package, Clock, CheckCircle, IndianRupee, ChefHat, Calculator, CalendarDays, Star } from 'lucide-react';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthlyBill, setMonthlyBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewedOrders, setReviewedOrders] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/myorders');
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const calculateMonthlyBill = async () => {
    setBillLoading(true);
    try {
      const today = new Date();
      const { data } = await api.get(`/orders/monthly-bill?month=${today.getMonth()}&year=${today.getFullYear()}`);
      setMonthlyBill(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBillLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasDeliveredItem = (order) => (
    order.status === 'delivered'
    || order.orderSchedule?.some((item) => item.status === 'delivered')
  );

  const updateReviewDraft = (orderId, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [orderId]: {
        rating: 5,
        comment: '',
        ...current[orderId],
        [field]: value,
      },
    }));
  };

  const submitReview = async (order) => {
    const draft = reviewDrafts[order._id] || { rating: 5, comment: '' };

    if (!draft.comment.trim()) {
      alert('Please add a short comment with your rating.');
      return;
    }

    try {
      await api.post(`/meals/${order.mealPlan._id}/reviews`, {
        rating: Number(draft.rating),
        comment: draft.comment.trim(),
      });
      setReviewedOrders((current) => ({ ...current, [order._id]: true }));
      alert('Thanks! Your item rating updated the kitchen rating.');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled', 'rejected'].includes(o.status));

  const renderOrderCard = (order) => (
    <div key={order._id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-start hover:scale-[1.01] transition-transform duration-300">
      <div className="flex-1 w-full md:w-auto mb-4 md:mb-0">
        <div className="flex justify-between items-start md:items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{order.mealPlan?.name || 'Deleted Plan'}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <p className="text-gray-700 flex items-center mb-1">
          <ChefHat className="w-4 h-4 mr-2" /> Provider: <span className="font-semibold ml-1">{order.provider?.name || 'Unknown'}</span>
        </p>
        <p className="text-sm text-gray-500 flex items-center">
          <Clock className="w-4 h-4 mr-2" /> Placed on: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
        </p>
        {order.subscriptionType !== 'one-time' && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
              <p className="text-xs font-bold text-teal-700 uppercase">Next Order</p>
              <p className="text-sm text-slate-800 flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {order.nextOrderDate ? new Date(order.nextOrderDate).toLocaleDateString() : 'Completed'}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-700 uppercase">Month Orders</p>
              <p className="text-sm text-slate-800">{order.orderSchedule?.length || 1} scheduled</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-bold text-slate-600 uppercase">Routine Bill</p>
              <p className="text-sm text-slate-900 font-bold">Rs. {order.monthlyBill || order.totalPrice}</p>
            </div>
          </div>
        )}
        <div className="mt-3 bg-white/40 p-3 rounded-lg border border-white/20">
          <p className="text-sm font-semibold text-gray-800">Delivery Address:</p>
          <p className="text-sm text-gray-600">
            {order.deliveryAddress?.address}, {order.deliveryAddress?.city} - {order.deliveryAddress?.zipCode}
          </p>
        </div>
        {hasDeliveredItem(order) && order.mealPlan?._id && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
            {reviewedOrders[order._id] ? (
              <p className="text-sm font-bold text-emerald-700">Rating submitted. Kitchen rating has been updated.</p>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900 mb-3">Rate this item</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="glass-input rounded-lg px-3 py-2 text-sm"
                    value={reviewDrafts[order._id]?.rating || 5}
                    onChange={(e) => updateReviewDraft(order._id, 'rating', e.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} star{rating > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <input
                    className="glass-input rounded-lg px-3 py-2 text-sm flex-1"
                    placeholder="How was the food?"
                    value={reviewDrafts[order._id]?.comment || ''}
                    onChange={(e) => updateReviewDraft(order._id, 'comment', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => submitReview(order)}
                    className="action-button bg-amber-400 hover:bg-amber-500 text-slate-950"
                  >
                    <Star className="w-4 h-4" /> Rate
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="md:ml-8 text-right w-full md:w-auto">
        <div className="text-2xl font-extrabold text-teal-700 flex items-center md:justify-end">
          <IndianRupee className="w-6 h-6" />{order.totalPrice}
        </div>
        <p className="text-sm text-gray-600 capitalize">{order.subscriptionType} price</p>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 flex items-center">
              <Package className="w-8 h-8 mr-3 text-teal-600" /> My Orders
            </h1>
            <p className="text-slate-600 mt-1">Routine orders are filled automatically until the end of the month.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={calculateMonthlyBill}
              disabled={billLoading}
              className="action-button bg-amber-400 hover:bg-amber-500 text-slate-950 disabled:opacity-60"
            >
              <Calculator className="w-4 h-4" /> {billLoading ? 'Calculating...' : 'Monthly Bill'}
            </button>
            <button onClick={() => navigate('/customer/dashboard')} className="action-button bg-white hover:bg-slate-50 text-gray-800">Dashboard</button>
          </div>
        </div>

        {monthlyBill && (
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">This Month's Bill</h2>
                <p className="text-slate-600">{monthlyBill.items.length} active routine/order line items</p>
              </div>
              <div className="text-4xl font-extrabold text-teal-700 flex items-center">
                <IndianRupee className="w-8 h-8" />{monthlyBill.total}
              </div>
            </div>
            {monthlyBill.items.length > 0 && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {monthlyBill.items.map((item) => (
                  <div key={item.orderId} className="rounded-xl border border-slate-200 bg-white/80 p-4">
                    <p className="font-bold text-slate-900">{item.mealPlan}</p>
                    <p className="text-sm text-slate-600">{item.provider} - {item.billableDays} delivery days</p>
                    <p className="text-sm font-bold text-teal-700 mt-1">Rs. {item.amount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-800">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 glass-panel">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl">
            <p className="text-gray-800 text-lg">You have no active orders yet. Start exploring providers!</p>
            <button onClick={() => navigate('/customer/providers')} className="mt-4 px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">Browse Providers</button>
          </div>
        ) : (
          <>
            <div className="glass-panel p-6 sm:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-yellow-600" /> Active Subscriptions
              </h2>
              {activeOrders.length === 0 ? (
                <p className="text-gray-600 italic">No active subscriptions right now.</p>
              ) : (
                <div className="space-y-6">
                  {activeOrders.map(order => renderOrderCard(order))}
                </div>
              )}
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-gray-600" /> Past Orders
              </h2>
              {pastOrders.length === 0 ? (
                <p className="text-gray-600 italic">No past orders to display.</p>
              ) : (
                <div className="space-y-6">
                  {pastOrders.map(order => renderOrderCard(order))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;
