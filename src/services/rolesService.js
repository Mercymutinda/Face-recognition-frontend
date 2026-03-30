// src/services/roleService.js
import api from "@/utils/api";

export const roleService = {
  getRoles: (params) => api.get("/roles", { params }),

  createRole: (data) => api.post("/roles", data),
};
