import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, Pencil, ShieldCheck, UserCircle } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [activeForm, setActiveForm] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const homePath = user?.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard';

  const showForm = (formName) => {
    setActiveForm(formName);
    setMessage('');
    setError('');
  };

  const handlePasswordChange = (event) => {
    setPasswordForm({ ...passwordForm, [event.target.name]: event.target.value });
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const { data } = await api.put('/auth/profile', { name: profileName });
      setUser(data);
      setMessage('Profile updated successfully.');
      setActiveForm('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage(data.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveForm('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="action-button bg-white hover:bg-slate-50 text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700 mb-4">
                <ShieldCheck className="w-4 h-4" /> Account security
              </div>
              <h1 className="text-4xl font-extrabold text-slate-950">User Dashboard</h1>
              <p className="text-slate-600 mt-2">Choose what you want to update. Email cannot be changed.</p>
            </div>
            <div className="rounded-2xl bg-slate-950 text-white p-5 min-w-full md:min-w-72">
              <UserCircle className="w-10 h-10 text-amber-300 mb-3" />
              <p className="text-xl font-bold">{user?.name}</p>
              <p className="text-sm text-slate-300">{user?.email}</p>
              <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>}
          {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

          {!activeForm && (
            <div>
              <h2 className="text-2xl font-bold text-slate-950 mb-2">Account Actions</h2>
              <p className="text-sm text-slate-600 mb-6">Select an option before making changes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => showForm('profile')}
                  className="food-card p-6 text-left"
                >
                  <Pencil className="w-7 h-7 text-teal-700 mb-4" />
                  <span className="block text-xl font-bold text-slate-950">Edit Profile</span>
                  <span className="block text-sm text-slate-600 mt-1">Change your display name. Email stays locked.</span>
                </button>
                <button
                  type="button"
                  onClick={() => showForm('password')}
                  className="food-card p-6 text-left"
                >
                  <LockKeyhole className="w-7 h-7 text-amber-700 mb-4" />
                  <span className="block text-xl font-bold text-slate-950">Change Password</span>
                  <span className="block text-sm text-slate-600 mt-1">Verify your current password first.</span>
                </button>
              </div>
            </div>
          )}

          {activeForm === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Edit Profile</h2>
                <p className="text-sm text-slate-600">Only your name can be changed here. Email is locked.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="glass-input w-full rounded-xl px-4 py-3"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                  value={user?.email || ''}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={saving} className="action-button bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button type="button" onClick={() => showForm('')} className="action-button bg-white hover:bg-slate-50 text-slate-800">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {activeForm === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <h2 className="text-2xl font-bold text-slate-950">Change Password</h2>
                <p className="text-sm text-slate-600">Use at least 6 characters for your new password.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="glass-input w-full rounded-xl px-4 py-3"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength="6"
                  className="glass-input w-full rounded-xl px-4 py-3"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength="6"
                  className="glass-input w-full rounded-xl px-4 py-3"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="md:col-span-3 flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={saving} className="action-button bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
                <button type="button" onClick={() => showForm('')} className="action-button bg-white hover:bg-slate-50 text-slate-800">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
