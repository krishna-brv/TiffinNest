import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import AuthLayout from '../components/ui/AuthLayout';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import PasswordField from '../components/ui/PasswordField';

const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'provider') return '/provider/dashboard';
  return '/customer/dashboard';
};

const Login = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleButtonRef = useRef(null);
  const queryParams = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleRole, setGoogleRole] = useState('customer');
  const [mode, setMode] = useState(queryParams.get('resetToken') ? 'reset' : 'login');
  const [resetToken, setResetToken] = useState(queryParams.get('resetToken') || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { login, loginWithGoogle, loading, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name}!`, 'success');
      navigate(getDashboardPath(user.role));
    } catch (err) {
      addToast(err, 'error');
    }
  };

  useEffect(() => {
    if (!googleClientId || mode !== 'login') return undefined;

    const handleGoogleCredential = async (response) => {
      try {
        const user = await loginWithGoogle(response.credential, googleRole);
        addToast(`Welcome back, ${user.name}!`, 'success');
        navigate(getDashboardPath(user.role));
      } catch (err) {
        addToast(err, 'error');
      }
    };

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.offsetWidth || 320,
        text: 'continue_with',
      });
    };

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    if (existingScript) {
      renderGoogleButton();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);

    return undefined;
  }, [addToast, googleClientId, googleRole, loginWithGoogle, mode, navigate]);

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
      navigate(getDashboardPath(data.role));
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
    setShowPassword(false);
    if (nextMode !== 'reset') {
      setResetToken('');
    }
  };

  const title = mode === 'login' ? 'Sign in' : 'Set new password';
  const subtitle = mode === 'login'
    ? 'Access your orders, kitchen profile, and routine schedules.'
    : 'Use your reset token to choose a new password.';

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      asideTitle="Clean routines need clean access."
      asideBody="Short access sessions and refresh tokens keep the app responsive without making providers and customers sign in repeatedly."
    >
      {mode === 'login' && (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Field
              label="Email address"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordField
              label="Password"
              value={password}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          {googleClientId && (
            <>
              <div className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Continue with Google as</span>
                <select
                  className="field-control cursor-pointer"
                  value={googleRole}
                  onChange={(e) => setGoogleRole(e.target.value)}
                >
                  <option value="customer">Customer (Looking for food)</option>
                  <option value="provider">Provider (Home cook)</option>
                </select>
              </label>
              <div ref={googleButtonRef} className="flex min-h-11 justify-center" />
            </>
          )}
          <div className="text-center text-sm">
            <Link to="/register" className="font-bold text-teal-700 hover:text-teal-900">
              Create account
            </Link>
          </div>
        </form>
      )}

      {mode === 'reset' && (
        <form className="space-y-5" onSubmit={submitPasswordReset}>
          <div className="space-y-4">
            <Field
              label="Reset token"
              type="text"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
            />
            <PasswordField
              label="New password"
              value={password}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              onChange={(e) => setPassword(e.target.value)}
              name="newPassword"
              autoComplete="new-password"
              minLength="6"
            />
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              onChange={(e) => setConfirmPassword(e.target.value)}
              name="confirmPassword"
              autoComplete="new-password"
              minLength="6"
            />
          </div>
          <Button type="submit" disabled={resetLoading} className="w-full">
            {resetLoading ? 'Updating password...' : 'Update password'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => resetFormState('login')} className="w-full">
            Back to sign in
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default Login;
