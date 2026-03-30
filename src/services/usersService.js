// src/services/userService.js
import api from "@/utils/api";

export const userService = {
  getMyProfile: () => api.get("/users/me"),

  getUsers: (params) => api.get("/users", { params }),

  updateUser: (userId, data) => api.patch(`/users/${userId}`, data),

  deleteUser: (userId) => api.delete(`/users/${userId}`),

  restoreUser: (userId) => api.patch(`/users/${userId}/restore`),

  assignRole: (userId, data) => api.post(`/users/${userId}/assign-role`, data),
};
