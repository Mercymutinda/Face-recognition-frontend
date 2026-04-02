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
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const authStore = useAuthStore(); // Call inside the function!

      try {
        // Make sure refreshToken exists in authStore.js!
        await authStore.refreshToken();
        originalRequest.headers["Authorization"] =
          `Bearer ${authStore.accessToken}`;
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
