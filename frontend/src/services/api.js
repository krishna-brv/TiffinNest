import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');

    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo);
      config.headers.Authorization = `Bearer ${parsedUserInfo.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
