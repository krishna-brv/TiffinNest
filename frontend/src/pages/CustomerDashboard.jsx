import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Clock,
  Heart,
  IndianRupee,
  LogOut,
  Moon,
  PackageCheck,
  Search,
  Sparkles,
  Sun,
  UserCircle,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useOrderStore from '../store/orderStore';
import useUIStore from '../store/uiStore';
import MetricCard from '../components/ui/MetricCard';

const getLocalDateKey = (date) => {
  const nextDate = new Date(date);
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => (
  date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None'
);

const formatFullDate = (dateKey) => (
  new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
);

const MiniCalendar = ({ subscriptionDates, selectedDateKey, onSelectDate }) => {
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
    <div className="w-full max-w-72 rounded-2xl bg-blue-950/55 p-4 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur">
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
          const dateKey = day ? getLocalDateKey(new Date(year, month, day)) : '';
          const hasSubscription = subscriptionDates.has(dateKey);
          const isSelected = selectedDateKey === dateKey;
          const isToday = day === today.getDate();

          return (
            <button
              type="button"
              key={`${day || 'empty'}-${index}`}
              disabled={!day}
              onClick={() => day && onSelectDate(dateKey)}
              className={`relative aspect-square rounded-lg flex items-center justify-center transition ${
                isSelected
                  ? 'bg-teal-300 text-slate-950 font-extrabold ring-2 ring-white'
                  : isToday
                  ? 'bg-amber-300 text-slate-950 font-extrabold'
                  : day
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : ''
              }`}
            >
              {day}
              {hasSubscription && (
                <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${isToday || isSelected ? 'bg-slate-950' : 'bg-teal-300'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const { user, logout } = useAuthStore();
  const { orders, fetchMyOrders, loading } = useOrderStore();
  const { theme, toggleTheme } = useUIStore();
  const [selectedDateKey, setSelectedDateKey] = useState(getLocalDateKey(new Date()));
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const dashboard = useMemo(() => {
    const activeStatuses = ['pending', 'accepted', 'preparing'];
    const activeOrders = orders.filter((order) => activeStatuses.includes(order.status));
    const routineOrders = orders.filter((order) => order.subscriptionType !== 'one-time' && activeStatuses.includes(order.status));
    const deliveredCount = orders.filter((order) => (
      order.status === 'delivered' || order.orderSchedule?.some((item) => item.status === 'delivered')
    )).length;
    const monthlyEstimate = activeOrders.reduce((sum, order) => sum + (order.monthlyBill || order.totalPrice || 0), 0);
    const nextOrder = routineOrders
      .filter((order) => order.nextOrderDate)
      .sort((a, b) => new Date(a.nextOrderDate) - new Date(b.nextOrderDate))[0];
    const subscriptionDates = new Set();

    orders.forEach((order) => {
      order.orderSchedule?.forEach((scheduleItem) => {
        if (scheduleItem.status !== 'skipped') {
          subscriptionDates.add(getLocalDateKey(scheduleItem.date));
        }
      });
    });

    const selectedDateOrders = orders.flatMap((order) => {
      const scheduleMatches = order.orderSchedule
        ?.filter((scheduleItem) => getLocalDateKey(scheduleItem.date) === selectedDateKey)
        .map((scheduleItem) => ({
          order,
          scheduleStatus: scheduleItem.status,
          scheduleDate: scheduleItem.date,
        })) || [];

      if (scheduleMatches.length > 0) {
        return scheduleMatches;
      }

      const fallbackDate = order.startDate || order.createdAt;
      if (fallbackDate && getLocalDateKey(fallbackDate) === selectedDateKey) {
        return [{
          order,
          scheduleStatus: order.status,
          scheduleDate: fallbackDate,
        }];
      }

      return [];
    });

    return {
      activeOrders,
      routineOrders,
      deliveredCount,
      monthlyEstimate,
      nextOrder,
      subscriptionDates,
      selectedDateOrders,
      recentOrders: [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4),
    };
  }, [orders, selectedDateKey]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statCards = [
    { label: 'Active Orders', value: dashboard.activeOrders.length, icon: ClipboardList, color: 'bg-teal-50 text-teal-700' },
    { label: 'Routines', value: dashboard.routineOrders.length, icon: CalendarDays, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Delivered', value: dashboard.deliveredCount, icon: PackageCheck, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Month Estimate', value: `Rs. ${dashboard.monthlyEstimate}`, icon: IndianRupee, color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="app-shell">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[12rem_1fr]">
        <aside className="dashboard-panel rounded-2xl p-3 lg:sticky lg:top-6 lg:self-start">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button onClick={() => navigate('/account')} className="action-button slide-color-card bg-white text-slate-900 hover:text-white dark:bg-white/10 dark:text-white">
              <UserCircle className="w-4 h-4" /> Account
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="action-button bg-white text-slate-900 hover:bg-slate-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
            <button onClick={handleLogout} className="action-button bg-rose-500 hover:bg-rose-600 text-white lg:col-span-1 col-span-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="dashboard-hero rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-cyan-100 mb-4">
                  <Sparkles className="w-4 h-4" /> Customer dashboard
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2">Welcome back, {user?.name}</h1>
                <p className="text-cyan-50 font-medium text-lg">
                  Track todayâ€™s food flow, keep routines under control, and jump back into your favorite kitchens.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button onClick={() => navigate('/customer/providers')} className="action-button slide-color-card bg-teal-600 text-white">
                    <Search className="w-4 h-4" /> Browse Providers
                  </button>
                  <button onClick={() => navigate('/customer/orders')} className="action-button slide-color-card slide-color-card--dark bg-slate-950 text-white">
                    <ClipboardList className="w-4 h-4" /> My Orders
                  </button>
                </div>
                <div className="mt-4 rounded-2xl bg-white/12 border border-white/15 p-5 max-w-xl">
                  <p className="text-xs font-bold uppercase text-cyan-100">Next Routine</p>
                  <p className="mt-2 text-2xl font-extrabold text-white">{formatDate(dashboard.nextOrder?.nextOrderDate)}</p>
                  <p className="mt-1 text-sm text-cyan-50">{dashboard.nextOrder?.mealPlan?.name || 'No upcoming routine scheduled'}</p>
                  {dashboard.nextOrder?.deliverySlot && (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                      <Clock className="w-3.5 h-3.5" /> {dashboard.nextOrder.deliverySlot}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-72 lg:justify-self-end">
                <MiniCalendar
                  subscriptionDates={dashboard.subscriptionDates}
                  selectedDateKey={selectedDateKey}
                  onSelectDate={setSelectedDateKey}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((item) => {
              return (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={loading ? '...' : item.value}
                  icon={item.icon}
                  tone={item.label === 'Month Estimate' ? 'amber' : 'teal'}
                />
              );
            })}
          </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="dashboard-panel rounded-2xl p-6">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold uppercase text-teal-700">Selected Date</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatFullDate(selectedDateKey)}</h2>
              </div>
              <button onClick={() => navigate('/customer/orders')} className="text-sm font-bold text-teal-700 hover:text-teal-800">Manage orders</button>
            </div>
            {dashboard.selectedDateOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-indigo-700">
                <CalendarDays className="mx-auto mb-3 w-8 h-8 text-teal-500" />
                <p className="font-bold text-slate-900 dark:text-slate-100">No orders on this date</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Click a marked date to see scheduled deliveries.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dashboard.selectedDateOrders.map(({ order, scheduleStatus, scheduleDate }) => (
                  <div key={`${order._id}-${scheduleDate}`} className="dashboard-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-50">{order.mealPlan?.name || 'Deleted Plan'}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{order.provider?.name || 'Provider'} - {order.deliverySlot}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                        {scheduleStatus}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="rounded-full bg-teal-50 px-3 py-1 font-bold text-teal-700 capitalize">{order.subscriptionType}</span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">Rs. {order.totalPrice}</span>
                      <span className="rounded-full bg-slate-50 px-3 py-1 font-bold text-slate-700 uppercase">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-panel rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Recent Activity</h2>
              <button onClick={() => navigate('/customer/orders')} className="text-sm font-bold text-teal-700 hover:text-teal-800">View all</button>
            </div>
            {dashboard.recentOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-indigo-700">
                <Heart className="mx-auto mb-3 w-8 h-8 text-rose-400" />
                <p className="font-bold text-slate-900 dark:text-slate-100">No orders yet</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Find a kitchen and start with a one-time order or routine.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentOrders.map((order) => (
                  <div key={order._id} className="dashboard-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-50">{order.mealPlan?.name || 'Deleted Plan'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{order.provider?.name || 'Provider'} • {formatDate(order.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{order.status}</span>
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

export default CustomerDashboard;
