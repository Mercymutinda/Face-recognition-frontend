// src/services/roleService.js
import api from "@/utils/api";

export const rolesService = {
  getRoles: (params) => api.get("/roles", { params }),

  createRole: (data) => api.post("/roles", data),
};
