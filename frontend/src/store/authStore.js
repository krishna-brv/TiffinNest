import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('userInfo')) || null,
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

  logout: () => {
    set({ user: null });
    localStorage.removeItem('userInfo');
  },

  setUser: (user) => {
    set({ user });
    localStorage.setItem('userInfo', JSON.stringify(user));
  },
}));

export default useAuthStore;
