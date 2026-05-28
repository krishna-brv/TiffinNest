import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import AuthLayout from '../components/ui/AuthLayout';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import PasswordField from '../components/ui/PasswordField';

const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'provider') return '/provider/dashboard';
  return '/customer/dashboard';
};

const Register = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleButtonRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const { register, loginWithGoogle, loading } = useAuthStore();
  const navigate = useNavigate();

  const redirectForRole = useCallback((user) => {
    navigate(getDashboardPath(user.role));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(name, email, password, role);
      redirectForRole(user);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    if (!googleClientId) return undefined;

    const handleGoogleCredential = async (response) => {
      try {
        const user = await loginWithGoogle(response.credential, role);
        redirectForRole(user);
      } catch (err) {
        setError(err);
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
  }, [googleClientId, loginWithGoogle, redirectForRole, role]);

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join as a customer or provider with the same secure account flow."
      asideTitle="One system for kitchens and customers."
      asideBody="Customers manage routines and addresses. Providers manage availability, meal plans, and prep queues from a focused workspace."
    >
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Field
              label="Full name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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
              autoComplete="new-password"
              minLength="6"
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Account type</span>
              <select
                className="field-control cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">Customer (Looking for food)</option>
                <option value="provider">Provider (Home cook)</option>
              </select>
            </label>
          </div>

          {googleClientId && (
            <>
              <div className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-center text-sm font-semibold text-teal-800">
                Google will create a {role} account.
              </div>
              <div ref={googleButtonRef} className="flex min-h-11 justify-center" />
            </>
          )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </Button>
          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-700 hover:text-teal-900">
              Sign in
            </Link>
          </p>
        </form>
    </AuthLayout>
  );
};

export default Register;
