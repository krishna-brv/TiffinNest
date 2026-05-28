import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  ChefHat,
  Clock,
  IndianRupee,
  LogOut,
  Moon,
  PackageCheck,
  Settings,
  Sun,
  Trophy,
  UserCircle,
  Utensils,
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import MetricCard from '../components/ui/MetricCard';

const getLocalDateKey = (date) => {
  const nextDate = new Date(date);
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatFullDate = (dateKey) => (
  new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
);

const ProviderMiniCalendar = ({ orderDates, selectedDateKey, onSelectDate }) => {
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
    <div className="dashboard-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-blue-700">Order Calendar</p>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
            {today.toLocaleString('default', { month: 'long' })} {year}
          </h2>
        </div>
        <CalendarDays className="h-6 w-6 text-blue-600" />
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((day, index) => {
          const dateKey = day ? getLocalDateKey(new Date(year, month, day)) : '';
          const hasOrders = orderDates.has(dateKey);
          const isSelected = selectedDateKey === dateKey;
          const isToday = day === today.getDate();

          return (
            <button
              type="button"
              key={`${day || 'empty'}-${index}`}
              disabled={!day}
              onClick={() => day && onSelectDate(dateKey)}
              className={`relative flex aspect-square items-center justify-center rounded-lg transition ${
                isSelected
                  ? 'bg-blue-600 text-white font-extrabold'
                  : isToday
                    ? 'bg-amber-300 text-slate-950 font-extrabold'
                    : day
                      ? 'bg-slate-100 text-slate-800 hover:bg-blue-50 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20'
                      : ''
              }`}
            >
              {day}
              {hasOrders && (
                <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ProviderDashboard = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(getLocalDateKey(new Date()));

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [{ data: analyticsData }, { data: orderData }, { data: providers }] = await Promise.all([
          api.get('/providers/analytics/summary'),
          api.get('/orders/provider'),
          api.get('/providers'),
        ]);
        setAnalytics(analyticsData);
        setOrders(orderData);
        setProfile(providers.find((provider) => provider.user?._id === user?._id));
      } catch (error) {
        console.error(error);
      }
    };

    if (user?._id) fetchDashboard();
  }, [user?._id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeOrders = useMemo(() => (
    orders
      .filter((order) => ['pending', 'accepted', 'preparing'].includes(order.status))
      .sort((a, b) => new Date(a.nextOrderDate || a.createdAt) - new Date(b.nextOrderDate || b.createdAt))
      .slice(0, 5)
  ), [orders]);

  const calendarData = useMemo(() => {
    const orderDates = new Set();

    orders.forEach((order) => {
      order.orderSchedule?.forEach((scheduleItem) => {
        if (scheduleItem.status !== 'skipped') {
          orderDates.add(getLocalDateKey(scheduleItem.date));
        }
      });
    });

    const selectedDateOrders = orders.flatMap((order) => (
      order.orderSchedule
        ?.filter((scheduleItem) => (
          scheduleItem.status !== 'skipped'
          && getLocalDateKey(scheduleItem.date) === selectedDateKey
        ))
        .map((scheduleItem) => ({
          order,
          scheduleStatus: scheduleItem.status,
          scheduleDate: scheduleItem.date,
        })) || []
    ));

    return {
      orderDates,
      selectedDateOrders: selectedDateOrders.sort((a, b) => (
        (a.order.deliverySlot || '').localeCompare(b.order.deliverySlot || '')
      )),
    };
  }, [orders, selectedDateKey]);

  const statCards = [
    { label: 'Today', value: analytics?.todayOrders ?? 0, icon: CalendarCheck, color: 'text-teal-700 bg-teal-50' },
    { label: 'Active Orders', value: analytics?.activeOrders ?? 0, icon: PackageCheck, color: 'text-blue-700 bg-blue-50' },
    { label: 'Routines', value: analytics?.activeRoutines ?? 0, icon: BarChart3, color: 'text-indigo-700 bg-indigo-50' },
    { label: 'Active Order Value', value: `Rs. ${analytics?.monthlyEstimate ?? 0}`, icon: IndianRupee, color: 'text-amber-700 bg-amber-50' },
  ];

  return (
    <div className="app-shell">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[12rem_1fr]">
        <aside className="dashboard-panel rounded-2xl p-3 lg:sticky lg:top-6 lg:self-start">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button onClick={() => navigate('/account')} className="action-button slide-color-card bg-white hover:bg-slate-50 text-slate-900 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
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
            <button onClick={handleLogout} className="action-button bg-red-500/90 hover:bg-red-600 text-white lg:col-span-1 col-span-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="dashboard-hero rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
              <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-orange-100 mb-4">
                <ChefHat className="w-4 h-4" /> Provider workspace
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-2">Chef {user?.name}</h1>
              <p className="text-cyan-50 font-medium text-lg">
                Monitor demand, prep the next batch, and keep your kitchen profile ready for customers.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate('/provider/orders')} className="action-button bg-blue-600 hover:bg-blue-700 text-white">
                  <PackageCheck className="w-4 h-4" /> Orders
                </button>
                <button onClick={() => navigate('/provider/plans')} className="action-button bg-orange-500 hover:bg-orange-600 text-white">
                  <Utensils className="w-4 h-4" /> Menu & Profile
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/15 text-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-slate-300">Kitchen Status</p>
                <button
                  type="button"
                  onClick={() => navigate('/provider/plans')}
                  className="rounded-full p-2 text-amber-300 transition hover:bg-white/10 hover:text-amber-200"
                  aria-label="Edit kitchen settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ${profile?.availability === false ? 'bg-rose-500/20 text-rose-200' : 'bg-teal-400/20 text-teal-200'}`}>
                {profile?.availability === false ? 'Not accepting orders' : 'Accepting orders'}
              </p>
              <p className="mt-4 text-sm text-slate-300">Slots</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(profile?.deliverySlots?.length ? profile.deliverySlots : ['Set slots in profile']).slice(0, 3).map((slot) => (
                  <span key={slot} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{slot}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((item) => {
            return (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                icon={item.icon}
                tone={item.label === 'Active Order Value' ? 'amber' : 'blue'}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
          <div className="dashboard-panel rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Prep Queue</h2>
              <button onClick={() => navigate('/provider/orders')} className="text-sm font-bold text-blue-700 hover:text-blue-800">Manage orders</button>
            </div>
            {activeOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-indigo-700">
                <Clock className="mx-auto mb-3 w-8 h-8 text-blue-400" />
                <p className="font-bold text-slate-900 dark:text-slate-100">No active prep right now</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">New and accepted orders will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div key={order._id} className="dashboard-card grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 rounded-xl p-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-50">{order.mealPlan?.name || 'Deleted Plan'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{order.customer?.name || 'Customer'} • {order.deliverySlot || 'Slot not set'}</p>
                    </div>
                    <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{order.status}</span>
                    <p className="self-start text-sm font-extrabold text-slate-900 dark:text-slate-50">Rs. {order.totalPrice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <ProviderMiniCalendar
              orderDates={calendarData.orderDates}
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
            />

            <div className="dashboard-panel rounded-2xl p-6">
              <div className="mb-5 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Top Meal</h2>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">{analytics?.topMeal?.name || 'None yet'}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {analytics?.topMeal ? `${analytics.topMeal.count} orders so far.` : 'Create plans and accept orders to build a top seller.'}
              </p>
              <button onClick={() => navigate('/provider/plans')} className="mt-6 action-button bg-orange-500 hover:bg-orange-600 text-white w-full">
                Update Menu
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-panel rounded-2xl p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-blue-700">Selected Date</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatFullDate(selectedDateKey)}</h2>
            </div>
            <button onClick={() => navigate('/provider/orders')} className="text-sm font-bold text-blue-700 hover:text-blue-800">Manage all orders</button>
          </div>

          {calendarData.selectedDateOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-indigo-700">
              <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-blue-400" />
              <p className="font-bold text-slate-900 dark:text-slate-100">No orders on this date</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Click a marked date to see the prep list for that day.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {calendarData.selectedDateOrders.map(({ order, scheduleStatus, scheduleDate }) => (
                <div key={`${order._id}-${scheduleDate}`} className="dashboard-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-50">{order.mealPlan?.name || 'Deleted Plan'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{order.customer?.name || 'Customer'} - {order.deliverySlot || 'Slot not set'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                      {scheduleStatus}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700 capitalize">{order.subscriptionType}</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">Rs. {order.totalPrice}</span>
                    <span className="rounded-full bg-slate-50 px-3 py-1 font-bold text-slate-700 uppercase">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
