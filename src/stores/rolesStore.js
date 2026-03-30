// src/stores/rolesStore.js
import { defineStore } from "pinia";
import { rolesService } from "@/services/rolesService";

export const useRolesStore = defineStore("roles", {
  state: () => ({
    roles: [],
    loading: false,
  }),

  actions: {
    async fetchRoles() {
      this.loading = true;
      try {
        const { data } = await rolesService.getRoles();
        this.roles = data;
      } finally {
        this.loading = false;
      }
    },

    async createRole(payload) {
      await rolesService.createRole(payload);
      await this.fetchRoles();
    },
  },
});