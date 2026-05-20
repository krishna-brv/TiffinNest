import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import { Eye, EyeOff, KeyRound, Utensils } from 'lucide-react';

const Login = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState(queryParams.get('resetToken') ? 'reset' : 'login');
  const [resetToken, setResetToken] = useState(queryParams.get('resetToken') || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { login, loading, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name}!`, 'success');
      if (user.role === 'provider') {
        navigate('/provider/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      addToast(err, 'error');
    }
  };

  const requestPasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      addToast(data.message, 'success');
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setMode('reset');
      }
    } catch (err) {
      const message = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || err.message;
      addToast(message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const submitPasswordReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }

    setResetLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        token: resetToken,
        password,
      });
      setUser(data);
      addToast('Password reset successfully.', 'success');
      navigate(data.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard');
    } catch (err) {
      const message = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || err.message;
      addToast(message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const resetFormState = (nextMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    if (nextMode !== 'reset') {
      setResetToken('');
    }
  };

  const title = mode === 'login'
    ? 'Sign in to your account'
    : mode === 'forgot'
      ? 'Reset your password'
      : 'Choose a new password';

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            {mode === 'login' ? <Utensils className="text-white h-6 w-6" /> : <KeyRound className="text-white h-6 w-6" />}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-950">
            {title}
          </h2>
          {mode === 'login' ? (
            <p className="mt-2 text-center text-sm text-slate-600">
              Or{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                create a new account
              </Link>
            </p>
          ) : (
            <p className="mt-2 text-center text-sm text-slate-600">
              Use the token generated for your account to update your password.
            </p>
          )}
        </div>

        {mode === 'login' && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-800">Email address</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-3 glass-input rounded-xl text-slate-950 placeholder:text-slate-400 caret-indigo-600 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800">Password</label>
              <div className="relative mt-1">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-3 pr-11 glass-input rounded-xl text-slate-950 placeholder:text-slate-400 caret-indigo-600 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-indigo-600"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => resetFormState('forgot')}
            className="w-full text-center text-sm font-bold text-indigo-600 hover:text-indigo-500"
          >
            Forgot password?
          </button>
        </form>
        )}

        {mode === 'forgot' && (
          <form className="mt-8 space-y-6" onSubmit={requestPasswordReset}>
            <div>
              <label className="block text-sm font-medium text-slate-800">Email address</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-3 glass-input rounded-xl text-slate-950 placeholder:text-slate-400 caret-indigo-600 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md transition-all"
            >
              {resetLoading ? 'Creating reset token...' : 'Create reset token'}
            </button>
            <button type="button" onClick={() => resetFormState('login')} className="w-full text-sm font-bold text-slate-700 hover:text-indigo-600">
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form className="mt-8 space-y-6" onSubmit={submitPasswordReset}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800">Reset token</label>
                <input
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-3 glass-input rounded-xl text-slate-950 placeholder:text-slate-400 caret-indigo-600 sm:text-sm"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">New password</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  className="mt-1 appearance-none relative block w-full px-3 py-3 glass-input rounded-xl text-slate-950 placeholder:text-slate-400 caret-indigo-600 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Confirm password</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  className="mt-1 appearance-none relative block w-full px-3 py-3 glass-input rounded-xl text-slate-950 placeholder:text-slate-400 caret-indigo-600 sm:text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md transition-all"
            >
              {resetLoading ? 'Updating password...' : 'Update password'}
            </button>
            <button type="button" onClick={() => resetFormState('login')} className="w-full text-sm font-bold text-slate-700 hover:text-indigo-600">
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
