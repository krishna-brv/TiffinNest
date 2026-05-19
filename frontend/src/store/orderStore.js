import { create } from 'zustand';
import api from '../services/api';

const useOrderStore = create((set) => ({
  orders: [],
  monthlyBill: 0,
  loading: false,
  error: null,

  fetchMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders/myorders');
      set({ orders: data, loading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
    }
  },

  fetchProviderOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders/provider');
      set({ orders: data, loading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
    }
  },

  fetchMonthlyBill: async () => {
    try {
      const { data } = await api.get('/orders/monthly-bill');
      set({ monthlyBill: data.total || 0 });
    } catch (error) {
      console.error("Failed to fetch monthly bill", error);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      set((state) => ({
        orders: state.orders.map((order) => 
          order._id === orderId ? { ...order, status: data.status } : order
        )
      }));
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  skipNextDelivery: async (orderId) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/skip-next`);
      set((state) => ({
        orders: state.orders.map((order) => order._id === orderId ? data : order)
      }));
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/cancel`);
      set((state) => ({
        orders: state.orders.map((order) => order._id === orderId ? data : order)
      }));
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  pauseRoutine: async (orderId, range) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/pause`, range);
      set((state) => ({
        orders: state.orders.map((order) => order._id === orderId ? data : order)
      }));
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw errorMessage;
    }
  },

  resumeRoutine: async (orderId) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/resume`);
      set((state) => ({
        orders: state.orders.map((order) => order._id === orderId ? data : order)
      }));
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw errorMessage;
    }
  }
}));

export default useOrderStore;
