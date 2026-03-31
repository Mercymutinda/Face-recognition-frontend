// src/utils/api.js
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

//  REQUEST INTERCEPTOR (Attach token)
api.interceptors.request.use((config) => {
  const authStore = useAuthStore();

  const token = authStore.accessToken; //  FIXED

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE INTERCEPTOR (Handle 401 + Refresh)
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const authStore = useAuthStore();

    const originalRequest = error.config;

    //  Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        //  Try refresh
        const newToken = await authStore.refreshToken();

        // Attach new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry original request
        return api(originalRequest);

      } catch (refreshError) {
        console.error('Refresh failed, logging out');

        authStore.logout(); //  FIXED
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;