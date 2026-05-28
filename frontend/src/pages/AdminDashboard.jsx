import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  Store,
  Trash2,
  Utensils,
  Users,
} from 'lucide-react';
import api from '../services/api';
import useUIStore from '../store/uiStore';

const orderStatuses = ['pending', 'preparing', 'delivered', 'cancelled'];
const providerStatuses = ['pending', 'approved', 'rejected'];

const tabs = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'meals', label: 'Meals', icon: Utensils },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'providers', label: 'Providers', icon: Store },
  { id: 'complaints', label: 'Complaints', icon: CheckCircle2 },
];

const emptyPage = { data: [], page: 1, pages: 1, total: 0, limit: 10 };

const formatDate = (date) => (
  date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'NA'
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState('users');
  const [summary, setSummary] = useState({ totalUsers: 0, totalMeals: 0, totalOrders: 0 });
  const [records, setRecords] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    users: '',
    meals: '',
    orders: '',
    providers: '',
    complaints: '',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filterValue = filters[activeTab];

  const endpoint = useMemo(() => {
    const base = `/admin/${activeTab}`;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search.trim()) params.set('search', search.trim());

    if (filterValue) {
      if (activeTab === 'users') {
        if (['customer', 'provider', 'admin'].includes(filterValue)) params.set('role', filterValue);
        if (filterValue === 'blocked') params.set('blocked', 'true');
        if (filterValue === 'active') params.set('blocked', 'false');
      }

      if (activeTab === 'meals') {
        if (filterValue === 'available') params.set('available', 'true');
        if (filterValue === 'unavailable') params.set('available', 'false');
        if (['veg', 'non-veg', 'vegan'].includes(filterValue)) params.set('type', filterValue);
      }

      if (activeTab === 'orders') params.set('status', filterValue);
      if (activeTab === 'providers') params.set('status', filterValue);
      if (activeTab === 'complaints') params.set('status', filterValue);
    }

    return `${base}?${params.toString()}`;
  }, [activeTab, filterValue, limit, page, search]);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/summary');
      setSummary(data);
    } catch (error) {
      addToast(error.response?.data?.message || error.message, 'error');
    }
  }, [addToast]);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(endpoint);
      setRecords(data);
    } catch (error) {
      addToast(error.response?.data?.message || error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, endpoint]);

  useEffect(() => {
    Promise.resolve().then(loadSummary);
  }, [loadSummary]);

  useEffect(() => {
    const timer = setTimeout(loadTab, 250);
    return () => clearTimeout(timer);
  }, [loadTab]);

  const cards = [
    { label: 'Total Users', value: summary.totalUsers, icon: Users },
    { label: 'Total Meals', value: summary.totalMeals, icon: Utensils },
    { label: 'Total Orders', value: summary.totalOrders, icon: ClipboardList },
  ];

  const refresh = () => {
    loadSummary();
    loadTab();
  };

  const runAction = async (action, successMessage) => {
    try {
      await action();
      addToast(successMessage, 'success');
      refresh();
    } catch (error) {
      addToast(error.response?.data?.message || error.message, 'error');
    }
  };

  const setFilter = (value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [activeTab]: value }));
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
    setSearch('');
  };

  const deleteUser = (userId) => {
    if (!window.confirm('Delete this user?')) return;
    runAction(() => api.delete(`/admin/users/${userId}`), 'User deleted');
  };

  const deleteMeal = (mealId) => {
    if (!window.confirm('Delete this meal?')) return;
    runAction(() => api.delete(`/admin/meals/${mealId}`), 'Meal deleted');
  };

  const filterOptions = {
    users: [
      ['customer', 'Customers'],
      ['provider', 'Providers'],
      ['admin', 'Admins'],
      ['active', 'Active'],
      ['blocked', 'Blocked'],
    ],
    meals: [
      ['available', 'Available'],
      ['unavailable', 'Unavailable'],
      ['veg', 'Veg'],
      ['non-veg', 'Non-veg'],
      ['vegan', 'Vegan'],
    ],
    orders: orderStatuses.map((status) => [status, status]),
    providers: providerStatuses.map((status) => [status, status]),
    complaints: [['open', 'Open'], ['resolved', 'Resolved']],
  };

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="dashboard-hero rounded-2xl p-5 shadow-2xl sm:p-6">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="action-button mb-5 bg-white text-slate-900 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-4xl font-extrabold text-white">Admin Panel</h1>
          <p className="mt-2 text-cyan-50">Search, filter, and manage records without loading the whole database.</p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="dashboard-card rounded-xl p-5">
                <Icon className="mb-4 h-7 w-7 text-teal-700" />
                <p className="text-sm font-bold uppercase text-slate-500">{card.label}</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">{card.value}</p>
              </div>
            );
          })}
        </section>

        <section className="dashboard-panel rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchTab(tab.id)}
                  className={`action-button ${selected ? 'bg-slate-950 text-white hover:bg-slate-900' : 'bg-white text-slate-800 hover:bg-slate-50 dark:bg-white/10 dark:text-white'}`}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="dashboard-panel rounded-2xl p-5">
          <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_12rem_8rem_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                className="field-control pl-10"
                placeholder={`Search ${activeTab}`}
              />
            </label>
            <select className="field-control" value={filterValue} onChange={(event) => setFilter(event.target.value)}>
              <option value="">All</option>
              {filterOptions[activeTab].map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              className="field-control"
              value={limit}
              onChange={(event) => {
                setPage(1);
                setLimit(Number(event.target.value));
              }}
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
            <button type="button" onClick={refresh} className="action-button bg-teal-600 text-white hover:bg-teal-700">
              Refresh
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold capitalize text-slate-950 dark:text-white">{activeTab}</h2>
            <p className="text-sm font-bold text-slate-500">
              {loading ? 'Loading...' : `${records.total} records - page ${records.page} of ${records.pages}`}
            </p>
          </div>

          {activeTab === 'users' && (
            <UsersTable records={records.data} deleteUser={deleteUser} runAction={runAction} />
          )}
          {activeTab === 'meals' && (
            <MealsTable records={records.data} deleteMeal={deleteMeal} runAction={runAction} />
          )}
          {activeTab === 'orders' && (
            <OrdersTable records={records.data} runAction={runAction} />
          )}
          {activeTab === 'providers' && (
            <ProvidersTable records={records.data} runAction={runAction} />
          )}
          {activeTab === 'complaints' && (
            <ComplaintsGrid records={records.data} runAction={runAction} />
          )}

          {!loading && records.data.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
              No records found.
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Showing up to {records.limit} per page
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={records.page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="action-button bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                disabled={records.page >= records.pages}
                onClick={() => setPage((current) => Math.min(current + 1, records.pages))}
                className="action-button bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const UsersTable = ({ records, deleteUser, runAction }) => (
  <Table headers={['User', 'Role', 'Status', 'Joined', 'Actions']} minWidth="760px">
    {records.map((item) => (
      <tr key={item._id} className="border-b border-slate-100 dark:border-slate-700">
        <td className="py-3">
          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
          <p className="text-slate-500">{item.email}</p>
        </td>
        <td className="capitalize">{item.role}</td>
        <td>{item.isBlocked ? 'Blocked' : 'Active'}</td>
        <td>{formatDate(item.createdAt)}</td>
        <td className="space-x-2 text-right">
          <button
            type="button"
            onClick={() => runAction(
              () => api.patch(`/admin/users/${item._id}/block`, { isBlocked: !item.isBlocked }),
              item.isBlocked ? 'User unblocked' : 'User blocked'
            )}
            className="action-button bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            <Ban className="h-4 w-4" /> {item.isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button type="button" onClick={() => deleteUser(item._id)} className="action-button bg-rose-600 text-white hover:bg-rose-700">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </td>
      </tr>
    ))}
  </Table>
);

const MealsTable = ({ records, deleteMeal, runAction }) => (
  <Table headers={['Meal', 'Provider', 'Price', 'Available', 'Actions']} minWidth="760px">
    {records.map((meal) => (
      <tr key={meal._id} className="border-b border-slate-100 dark:border-slate-700">
        <td className="py-3">
          <p className="font-bold text-slate-900 dark:text-white">{meal.name}</p>
          <p className="text-slate-500">{meal.type} - {meal.frequency}</p>
        </td>
        <td>{meal.provider?.name || 'Deleted provider'}</td>
        <td>Rs. {meal.price}</td>
        <td>{meal.isActive ? 'Yes' : 'No'}</td>
        <td className="space-x-2 text-right">
          <button
            type="button"
            onClick={() => runAction(
              () => api.patch(`/admin/meals/${meal._id}/availability`, { isActive: !meal.isActive }),
              meal.isActive ? 'Meal marked unavailable' : 'Meal marked available'
            )}
            className="action-button bg-slate-100 text-slate-800 hover:bg-slate-200"
          >
            {meal.isActive ? 'Mark Unavailable' : 'Mark Available'}
          </button>
          <button type="button" onClick={() => deleteMeal(meal._id)} className="action-button bg-rose-600 text-white hover:bg-rose-700">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </td>
      </tr>
    ))}
  </Table>
);

const OrdersTable = ({ records, runAction }) => (
  <Table headers={['Order', 'Customer', 'Provider', 'Status', 'Placed']} minWidth="780px">
    {records.map((order) => (
      <tr key={order._id} className="border-b border-slate-100 dark:border-slate-700">
        <td className="py-3 font-bold text-slate-900 dark:text-white">{order.mealPlan?.name || 'Deleted meal'}</td>
        <td>{order.customer?.name || 'Deleted user'}</td>
        <td>{order.provider?.name || 'Deleted provider'}</td>
        <td>
          <select
            className="field-control"
            value={order.status}
            onChange={(event) => runAction(
              () => api.patch(`/admin/orders/${order._id}/status`, { status: event.target.value }),
              'Order status updated'
            )}
          >
            {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </td>
        <td>{formatDate(order.createdAt)}</td>
      </tr>
    ))}
  </Table>
);

const ProvidersTable = ({ records, runAction }) => (
  <Table headers={['Provider', 'Email', 'Approval', 'Registered']} minWidth="680px">
    {records.map((provider) => (
      <tr key={provider._id} className="border-b border-slate-100 dark:border-slate-700">
        <td className="py-3 font-bold text-slate-900 dark:text-white">{provider.name}</td>
        <td>{provider.email}</td>
        <td>
          <select
            className="field-control"
            value={provider.providerApprovalStatus || 'pending'}
            onChange={(event) => runAction(
              () => api.patch(`/admin/providers/${provider._id}/approval`, { status: event.target.value }),
              'Provider approval updated'
            )}
          >
            {providerStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </td>
        <td>{formatDate(provider.createdAt)}</td>
      </tr>
    ))}
  </Table>
);

const ComplaintsGrid = ({ records, runAction }) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    {records.map((complaint) => (
      <div key={complaint._id} className="dashboard-card rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{complaint.subject}</p>
            <p className="text-sm text-slate-500">{complaint.user?.name || 'User'} - {formatDate(complaint.createdAt)}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
            {complaint.status}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{complaint.message}</p>
        {complaint.status !== 'resolved' && (
          <button
            type="button"
            onClick={() => runAction(
              () => api.patch(`/admin/complaints/${complaint._id}/resolve`),
              'Complaint marked resolved'
            )}
            className="action-button mt-4 bg-teal-600 text-white hover:bg-teal-700"
          >
            <CheckCircle2 className="h-4 w-4" /> Mark Resolved
          </button>
        )}
      </div>
    ))}
  </div>
);

const Table = ({ headers, minWidth, children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm" style={{ minWidth }}>
      <thead className="border-b text-xs uppercase text-slate-500">
        <tr>
          {headers.map((header, index) => (
            <th key={header} className={`py-3 ${index === headers.length - 1 ? 'text-right' : ''}`}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export default AdminDashboard;
