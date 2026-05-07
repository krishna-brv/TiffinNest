import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tiffinnest.onrender.com/api',
});

// Add a request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo);
      config.headers.Authorization = `Bearer ${parsedUserInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
