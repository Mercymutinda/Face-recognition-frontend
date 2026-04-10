import api from "@/utils/api";

export const usersService = {
  getMyProfile: () => api.get("/users/me"),

  getUsers: (params) => api.get("/users", { params }),

  // ADD THIS LINE
  createUser: (data) => api.post("/auth/signup", data),

  updateUser: (userId, data) => api.patch(`/users/${userId}`, data),

  deleteUser: (userId) => api.delete(`/users/${userId}`),

  restoreUser: (userId) => api.patch(`/users/${userId}/restore`),

  assignRole: (userId, data) => api.post(`/users/${userId}/assign-role`, data),
};