import { create } from 'zustand';
import api from '../services/api';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo')) || null;
  } catch {
    localStorage.removeItem('userInfo');
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getStoredUser(),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      set({ user: data, loading: false });
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      set({ loading: false });
      const errorMessage = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      set({ user: data, loading: false });
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      set({ loading: false });
      const errorMessage = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  loginWithGoogle: async (credential, role) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/google', { credential, role });
      set({ user: data, loading: false });
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      set({ loading: false });
      const errorMessage = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('userInfo');
  },

  setUser: (user) => {
    set({ user });
    localStorage.setItem('userInfo', JSON.stringify(user));
  },

  toggleFavoriteProvider: async (providerId) => {
    try {
      const { data } = await api.put(`/auth/favorites/${providerId}`);
      set((state) => {
        const user = {
          ...state.user,
          favoriteProviders: data.favoriteProviders,
        };
        localStorage.setItem('userInfo', JSON.stringify(user));
        return { user };
      });
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  saveAddressBook: async (addressBook) => {
    try {
      const { data } = await api.put('/auth/address-book', { addressBook });
      set({ user: data });
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },
}));

export default useAuthStore;
