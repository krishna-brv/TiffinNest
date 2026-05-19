import { create } from 'zustand';
import api from '../services/api';

const useProviderStore = create((set, get) => ({
  providers: [],
  loading: false,
  error: null,

  fetchProviders: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );
      const { data } = await api.get('/providers', { params });
      set({ providers: data, loading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
    }
  },
  
  getProviderById: (id) => {
    return get().providers.find(p => p.user._id === id);
  }
}));

export default useProviderStore;
