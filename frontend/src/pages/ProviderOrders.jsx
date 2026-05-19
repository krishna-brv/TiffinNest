import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Package, Clock, CheckCircle, IndianRupee, MapPin, ClipboardList } from 'lucide-react';

const ProviderOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [prepSheet, setPrepSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [{ data }, { data: prepData }] = await Promise.all([
          api.get('/orders/provider'),
          api.get('/providers/prep-sheet/today'),
        ]);
        // Sort by newest first
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedData);
        setPrepSheet(prepData);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order => order._id === orderId ? data : order));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
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

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled', 'rejected'].includes(o.status));

  const renderOrderCard = (order, isActive) => (
    <div key={order._id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center hover:scale-[1.01] transition-transform duration-300">
      <div className="flex-1 w-full md:w-auto mb-4 md:mb-0">
        <div className="flex justify-between items-start md:items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{order.mealPlan?.name || 'Deleted Plan'}</h2>
          {!isActive && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          )}
        </div>
        <p className="text-gray-700 font-semibold mb-1">
          Customer: <span className="font-normal">{order.customer?.name || 'Unknown'}</span> ({order.customer?.email})
        </p>
        <p className="text-sm text-gray-500 flex items-center">
          <Clock className="w-4 h-4 mr-2" /> Ordered: {new Date(order.createdAt).toLocaleString()}
        </p>
        <div className="mt-3 bg-white/40 p-3 rounded-lg border border-white/20">
          <p className="text-sm font-semibold text-gray-800 flex items-center"><MapPin className="w-4 h-4 mr-1"/> Delivery Address:</p>
          <p className="text-sm text-gray-600 mt-1">
            {order.deliveryAddress?.address}, {order.deliveryAddress?.city} - {order.deliveryAddress?.zipCode}
          </p>
        </div>
      </div>
      
      <div className="md:ml-8 text-left md:text-right w-full md:w-auto flex flex-col md:items-end">
        <div className="text-2xl font-extrabold text-blue-700 flex items-center md:justify-end mb-1">
          <IndianRupee className="w-6 h-6" />{order.totalPrice}
        </div>
        <p className="text-sm text-gray-600 capitalize mb-4">Routine: {order.subscriptionType}</p>
        
        {isActive && (
          <div className="w-full md:w-48">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Update Status</label>
            <select
              className={`w-full px-3 py-2 rounded-lg text-sm font-bold border cursor-pointer ${getStatusColor(order.status)}`}
              value={order.status}
              onChange={(e) => handleStatusChange(order._id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="delivered">Delivered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-blue-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-blue-600" /> Incoming Orders
          </h1>
          <button onClick={() => navigate('/provider/dashboard')} className="px-4 py-2 bg-white/50 hover:bg-white/80 text-gray-800 rounded-lg shadow transition">Dashboard</button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-800">Loading incoming orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 glass-panel">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl">
            <p className="text-gray-800 text-lg">No incoming orders yet. Keep cooking!</p>
          </div>
        ) : (
          <>
            <div className="dashboard-panel p-6 sm:p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ClipboardList className="w-6 h-6 mr-2 text-teal-600" /> Today's Prep Sheet
              </h2>
              {!prepSheet?.summary?.length ? (
                <p className="text-gray-600 italic">No meals to prep for today.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prepSheet.summary.map((item) => (
                    <div key={item.mealPlanId} className="dashboard-card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xl font-extrabold text-slate-950">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.items.join(', ')}</p>
                        </div>
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-extrabold text-teal-700">x {item.count}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(item.slots).map(([slot, count]) => (
                          <span key={slot} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{slot}: {count}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-yellow-600" /> Active Orders
              </h2>
              {activeOrders.length === 0 ? (
                <p className="text-gray-600 italic">No active orders right now.</p>
              ) : (
                <div className="space-y-6">
                  {activeOrders.map(order => renderOrderCard(order, true))}
                </div>
              )}
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" /> Delivered & Past Orders
              </h2>
              {pastOrders.length === 0 ? (
                <p className="text-gray-600 italic">No past orders to display.</p>
              ) : (
                <div className="space-y-6">
                  {pastOrders.map(order => renderOrderCard(order, false))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProviderOrders;
