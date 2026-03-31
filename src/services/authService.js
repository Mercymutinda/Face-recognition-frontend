// src/services/authService.js
import api from "@/utils/api";

export const authService = {
  login: (data) => {
    // Many FastAPI/OAuth2 backends expect form-encoded login
    const formData = new URLSearchParams();
    formData.append("username", data.username);
    formData.append("password", data.password);
    return api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  signup:      (data) => api.post("/auth/signup", data),
  refresh:     ()     => api.post("/auth/refresh"),
  logout:      ()     => api.post("/auth/logout"),
  lockAccount: (data) => api.post("/auth/lock-account", data),
};