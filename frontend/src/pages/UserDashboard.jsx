import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, LockKeyhole, Pencil, ShieldCheck, UserCircle, Moon, Sun, Trash2 } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, setUser, logout, saveAddressBook } = useAuthStore();
  const { addToast, theme, toggleTheme } = useUIStore();
  const [activeForm, setActiveForm] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteForm, setDeleteForm] = useState({
    currentPassword: '',
    confirmation: '',
  });
  const [addressBook, setAddressBook] = useState(user?.addressBook?.length ? user.addressBook : [
    { label: 'Home', address: '', city: '', zipCode: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const homePath = user?.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard';

  const showForm = (formName) => {
    setActiveForm(formName);
  };

  const handlePasswordChange = (event) => {
    setPasswordForm({ ...passwordForm, [event.target.name]: event.target.value });
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const { data } = await api.put('/auth/profile', { name: profileName });
      setUser(data);
      addToast('Profile updated successfully.', 'success');
      setActiveForm('');
    } catch (err) {
      addToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New password and confirmation do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      addToast(data.message || 'Password changed successfully.', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveForm('');
    } catch (err) {
      addToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    if (deleteForm.confirmation !== 'DELETE') {
      addToast('Type DELETE to confirm account deletion.', 'error');
      return;
    }

    if (!window.confirm('This will permanently delete your account and related data. Continue?')) {
      return;
    }

    setSaving(true);
    try {
      await api.delete('/auth/profile', {
        data: { currentPassword: deleteForm.currentPassword },
      });
      logout();
      addToast('Account deleted successfully.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateAddress = (index, field, value) => {
    setAddressBook((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const addAddress = () => {
    setAddressBook((current) => [...current, { label: '', address: '', city: '', zipCode: '' }]);
  };

  const removeAddress = (index) => {
    setAddressBook((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveAddressBook(addressBook);
      addToast('Address book updated successfully.', 'success');
      setActiveForm('');
    } catch (err) {
      addToast(err, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="account-hero rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <button
              type="button"
              onClick={() => navigate(homePath)}
              className="action-button slide-color-card bg-white/95 hover:bg-white text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={toggleTheme}
              className="action-button slide-color-card bg-white/95 hover:bg-white text-slate-900"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-cyan-100 mb-4">
                <ShieldCheck className="w-4 h-4" /> Account security
              </div>
              <h1 className="text-4xl font-extrabold text-white">User Dashboard</h1>
              <p className="text-cyan-50 mt-2">Choose what you want to update. Email cannot be changed.</p>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/15 text-white p-5 min-w-full md:min-w-72">
              <UserCircle className="w-10 h-10 text-amber-300 mb-3" />
              <p className="text-xl font-bold">{user?.name}</p>
              <p className="text-sm text-cyan-50">{user?.email}</p>
              <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="account-panel rounded-2xl p-6 sm:p-8 shadow-xl">
          {!activeForm && (
            <div>
              <h2 className="text-2xl font-bold text-slate-950 mb-2">Account Actions</h2>
              <p className="text-sm text-slate-700 mb-6">Select an option before making changes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => showForm('profile')}
                  className="account-action-card slide-color-card rounded-2xl p-6 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <Pencil className="w-7 h-7 text-teal-700 mb-4 dark:text-teal-400" />
                  <span className="block text-xl font-bold text-slate-950">Edit Profile</span>
                  <span className="block text-sm text-slate-700 mt-1">Change your display name. Email stays locked.</span>
                </button>
                <button
                  type="button"
                  onClick={() => showForm('password')}
                  className="account-action-card slide-color-card rounded-2xl p-6 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <LockKeyhole className="w-7 h-7 text-amber-700 mb-4 dark:text-amber-400" />
                  <span className="block text-xl font-bold text-slate-950">Change Password</span>
                  <span className="block text-sm text-slate-700 mt-1">Verify your current password first.</span>
                </button>
                {user?.role === 'customer' && (
                  <button
                    type="button"
                    onClick={() => showForm('addresses')}
                    className="account-action-card slide-color-card rounded-2xl p-6 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <Home className="w-7 h-7 text-indigo-700 mb-4" />
                    <span className="block text-xl font-bold text-slate-950">Address Book</span>
                    <span className="block text-sm text-slate-700 mt-1">Save home, office, or hostel delivery addresses.</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => showForm('delete')}
                  className="account-action-card slide-color-card rounded-2xl p-6 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <Trash2 className="w-7 h-7 text-rose-600 mb-4" />
                  <span className="block text-xl font-bold text-slate-950">Delete Account</span>
                  <span className="block text-sm text-slate-700 mt-1">Permanently remove your account and related records.</span>
                </button>
              </div>
            </div>
          )}

          {activeForm === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Edit Profile</h2>
                <p className="text-sm text-slate-700">Only your name can be changed here. Email is locked.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="glass-input w-full rounded-xl px-4 py-3 text-slate-950 caret-teal-600"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
                  value={user?.email || ''}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={saving} className="action-button bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button type="button" onClick={() => showForm('')} className="action-button slide-color-card bg-white hover:bg-slate-50 text-slate-800">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {activeForm === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <h2 className="text-2xl font-bold text-slate-950">Change Password</h2>
                <p className="text-sm text-slate-700">Use at least 6 characters for your new password.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Current Password</label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="glass-input w-full rounded-xl px-4 py-3 text-slate-950 caret-teal-600"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength="6"
                  className="glass-input w-full rounded-xl px-4 py-3 text-slate-950 caret-teal-600"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength="6"
                  className="glass-input w-full rounded-xl px-4 py-3 text-slate-950 caret-teal-600"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="md:col-span-3 flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={saving} className="action-button bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
                <button type="button" onClick={() => showForm('')} className="action-button slide-color-card bg-white hover:bg-slate-50 text-slate-800">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {activeForm === 'addresses' && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Address Book</h2>
                <p className="text-sm text-slate-700">Saved addresses can be selected while placing an order.</p>
              </div>
              <div className="space-y-4">
                {addressBook.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="dashboard-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="glass-input rounded-xl px-3 py-2 text-slate-950" placeholder="Label" value={item.label} onChange={(event) => updateAddress(index, 'label', event.target.value)} />
                    <input className="glass-input rounded-xl px-3 py-2 text-slate-950 md:col-span-2" placeholder="Full address" value={item.address} onChange={(event) => updateAddress(index, 'address', event.target.value)} />
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input className="glass-input rounded-xl px-3 py-2 text-slate-950" placeholder="City" value={item.city} onChange={(event) => updateAddress(index, 'city', event.target.value)} />
                      <input className="glass-input rounded-xl px-3 py-2 text-slate-950" placeholder="Zip" value={item.zipCode} onChange={(event) => updateAddress(index, 'zipCode', event.target.value)} />
                      <button type="button" onClick={() => removeAddress(index)} className="rounded-xl bg-rose-50 px-3 font-bold text-rose-700">X</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={addAddress} className="action-button slide-color-card bg-white hover:bg-slate-50 text-slate-800">Add Address</button>
                <button type="submit" disabled={saving} className="action-button bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Addresses'}
                </button>
                <button type="button" onClick={() => showForm('')} className="action-button slide-color-card bg-white hover:bg-slate-50 text-slate-800">Cancel</button>
              </div>
            </form>
          )}

          {activeForm === 'delete' && (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <h2 className="text-2xl font-bold text-rose-700">Delete Account</h2>
                <p className="mt-2 text-sm text-rose-700">
                  This permanently removes your account. Customer orders are deleted. Provider accounts also remove kitchen profile, meal plans, and provider orders.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  className="glass-input w-full rounded-xl px-4 py-3 text-slate-950 caret-rose-600"
                  value={deleteForm.currentPassword}
                  onChange={(event) => setDeleteForm({ ...deleteForm, currentPassword: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Type DELETE to confirm</label>
                <input
                  type="text"
                  required
                  className="glass-input w-full rounded-xl px-4 py-3 text-slate-950 caret-rose-600"
                  value={deleteForm.confirmation}
                  onChange={(event) => setDeleteForm({ ...deleteForm, confirmation: event.target.value })}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={saving} className="action-button bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60">
                  {saving ? 'Deleting...' : 'Delete Account'}
                </button>
                <button type="button" onClick={() => showForm('')} className="action-button slide-color-card bg-white hover:bg-slate-50 text-slate-800">
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
