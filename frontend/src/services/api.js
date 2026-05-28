import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');

    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        if (parsedUserInfo?.token) {
          config.headers.Authorization = `Bearer ${parsedUserInfo.token}`;
        }
      } catch {
        localStorage.removeItem('userInfo');
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublicAuthRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/google',
      '/auth/reset-password',
      '/auth/refresh',
    ].some((path) => originalRequest?.url?.includes(path));

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));

        if (!userInfo?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await api.post('/auth/refresh', {
          refreshToken: userInfo.refreshToken,
        });

        localStorage.setItem('userInfo', JSON.stringify(data));
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${data.token}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('userInfo');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
