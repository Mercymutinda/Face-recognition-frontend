// src/utils/api.js
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  const token = authStore.accessToken; 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR (Handle 401 + Refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // DO NOT try to refresh token if the failure happened on login or signup
    const isAuthRoute = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/signup');

    // If 401, we haven't tried to refresh yet, AND it's not an auth route
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const authStore = useAuthStore(); 
      try {
        await authStore.refreshToken();
        originalRequest.headers["Authorization"] = `Bearer ${authStore.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh failed, logging out", refreshError);
        authStore.logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;