import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
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
  return (
    <Router>
      <div className="min-h-screen bg-transparent text-gray-900 font-sans">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
