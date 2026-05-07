import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardList, LogOut, Search, Sparkles, UserCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const getDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const MiniCalendar = ({ subscriptionDates }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="w-full md:w-72 rounded-2xl bg-slate-950 text-white p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-teal-200">Routine Calendar</p>
          <h2 className="text-xl font-bold">
            {today.toLocaleString('default', { month: 'long' })} {year}
          </h2>
        </div>
        <CalendarDays className="w-6 h-6 text-amber-300" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-300 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((day, index) => {
          const dateKey = day ? getDateKey(new Date(year, month, day)) : '';
          const hasSubscription = subscriptionDates.has(dateKey);

          return (
            <span
              key={`${day || 'empty'}-${index}`}
              className={`relative aspect-square rounded-lg flex items-center justify-center ${
                day === today.getDate()
                  ? 'bg-amber-300 text-slate-950 font-extrabold'
                  : day
                    ? 'bg-white/10 text-white'
                    : ''
              }`}
            >
              {day}
              {hasSubscription && (
                <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${day === today.getDate() ? 'bg-slate-950' : 'bg-teal-300'}`} />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/myorders');
        setOrders(data);
      } catch (error) {
        console.error('Unable to load calendar subscriptions', error);
      }
    };

    fetchOrders();
  }, []);

  const subscriptionDates = useMemo(() => {
    const dates = new Set();

    orders.forEach((order) => {
      if (order.subscriptionType === 'one-time') return;

      order.orderSchedule?.forEach((scheduleItem) => {
        if (scheduleItem.status !== 'skipped') {
          dates.add(getDateKey(scheduleItem.date));
        }
      });
    });

    return dates;
  }, [orders]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="page-panel">
        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700 mb-4">
              <Sparkles className="w-4 h-4" /> Fresh meals, planned calmly
            </div>
            <h1 className="text-4xl font-extrabold text-slate-950 mb-2">Welcome back, {user?.name}</h1>
            <p className="text-slate-600 font-medium text-lg max-w-2xl">
              Browse kitchens, start a routine once, and let your tiffin schedule continue for the month.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button onClick={() => navigate('/account')} className="action-button bg-white hover:bg-slate-50 text-slate-800">
                <UserCircle className="w-4 h-4" /> Account
              </button>
              <button onClick={handleLogout} className="action-button bg-rose-500 hover:bg-rose-600 text-white">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
          <MiniCalendar subscriptionDates={subscriptionDates} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="food-card p-8 group">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-teal-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Available Providers</h2>
            <p className="text-gray-700 mb-6 line-clamp-2">
              Discover talented home cooks near you and explore their delicious daily menus.
            </p>
            <button
              onClick={() => navigate('/customer/providers')}
              className="action-button bg-teal-600 hover:bg-teal-700 text-white w-full"
            >
              Browse Providers
            </button>
          </div>

          <div className="food-card p-8 group">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
              <ClipboardList className="w-6 h-6 text-amber-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">My Active Orders</h2>
            <p className="text-gray-700 mb-6 line-clamp-2">
              Track routine schedules, monthly bills, and one-time orders in one place.
            </p>
            <button
              onClick={() => navigate('/customer/orders')}
              className="action-button bg-slate-950 hover:bg-slate-800 text-white w-full"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
