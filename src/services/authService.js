// src/services/authService.js
import api from "@/utils/api";

export const authService = {
  signup: (data) => api.post("/auth/signup", data),

  login: (data) => api.post("/auth/login", data),

  refresh: () => api.post("/auth/refresh"),

  logout: () => api.post("/auth/logout"),

  lockAccount: (data) => api.post("/auth/lock-account", data),
};
