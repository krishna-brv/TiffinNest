import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthStore from './store/authStore';
import useUIStore from './store/uiStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import ProvidersList from './pages/ProvidersList';
import CustomerOrders from './pages/CustomerOrders';
import ProviderPlans from './pages/ProviderPlans';
import ProviderOrders from './pages/ProviderOrders';
import ProviderMenu from './pages/ProviderMenu';
import UserDashboard from './pages/UserDashboard';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Toast from './components/Toast';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5001';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuthStore();

  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>;

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    return <Navigate to="/" />; // Redirect if role doesn't match
  }

  return children;
};

function App() {
  const { user } = useAuthStore();
  const { theme, addToast } = useUIStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = io(socketUrl);
    const orderEvent = user.role === 'provider' ? `new-order-${user._id}` : `order-status-${user._id}`;
    const providerEvent = user.role === 'provider' ? `order-status-${user._id}` : null;

    socket.on(orderEvent, () => {
      addToast(user.role === 'provider' ? 'New order received.' : 'Your order status was updated.', 'info');
    });

    if (providerEvent) {
      socket.on(providerEvent, () => addToast('An order was updated.', 'info'));
    }

    return () => {
      socket.disconnect();
    };
  }, [addToast, user]);

  return (
    <Router>
      <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-900'}`}>
        <Toast />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Customer Routes */}
          <Route path="/customer/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/providers" element={<ProtectedRoute role="customer"><ProvidersList /></ProtectedRoute>} />
          <Route path="/customer/provider/:id" element={<ProtectedRoute role="customer"><ProviderMenu /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute role="customer"><CustomerOrders /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          
          {/* Provider Routes */}
          <Route path="/provider/dashboard" element={<ProtectedRoute role="provider"><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/provider/plans" element={<ProtectedRoute role="provider"><ProviderPlans /></ProtectedRoute>} />
          <Route path="/provider/orders" element={<ProtectedRoute role="provider"><ProviderOrders /></ProtectedRoute>} />
          
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
