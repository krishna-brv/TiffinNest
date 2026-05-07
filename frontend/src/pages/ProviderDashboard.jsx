import React from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserCircle } from 'lucide-react';

const ProviderDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-transparent p-8 font-sans">
      <div className="max-w-7xl mx-auto glass-panel p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/20 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-orange-900 mb-2">Provider Dashboard</h1>
            <p className="text-gray-800 font-medium text-lg">Welcome, Chef {user?.name}! Ready to cook up a storm?</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/account')}
              className="action-button bg-white hover:bg-slate-50 text-slate-800"
            >
              <UserCircle className="w-4 h-4" /> Account
            </button>
            <button
              onClick={handleLogout}
              className="action-button bg-red-500/90 hover:bg-red-600 text-white"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-8 rounded-2xl hover:scale-[1.02] transition-transform duration-300 group border-t-4 border-t-orange-400">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">My Meal Plans</h2>
            <p className="text-gray-700 mb-6">Add, edit or remove your delicious offerings to attract more customers.</p>
            <button 
              onClick={() => navigate('/provider/plans')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md w-full transition-all duration-300 group-hover:shadow-lg"
            >
              Manage Plans
            </button>
          </div>

          <div className="glass-panel p-8 rounded-2xl hover:scale-[1.02] transition-transform duration-300 group border-t-4 border-t-blue-400">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Incoming Orders</h2>
            <p className="text-gray-700 mb-6">View and accept customer subscriptions and manage your deliveries.</p>
            <button 
              onClick={() => navigate('/provider/orders')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md w-full transition-all duration-300 group-hover:shadow-lg"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
