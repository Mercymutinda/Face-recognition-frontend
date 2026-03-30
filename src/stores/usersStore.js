// src/stores/usersStore.js
import { defineStore } from "pinia";
import { usersService } from "@/services/usersService";

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [],
    meta: { page: 1, limit: 10, total: 0 },
    loading: false,
    error: null,
  }),

  actions: {
    async fetchUsers(params = {}) {
      this.loading = true;
      try {
        const { data } = await usersService.getUsers(params);

        this.users = data.items || data;
        this.meta = data.meta || this.meta;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    async updateUser(id, payload) {
      await usersService.updateUser(id, payload);
      await this.fetchUsers();
    },

    async deleteUser(id) {
      await usersService.deleteUser(id);
      await this.fetchUsers();
    },

    async restoreUser(id) {
      await usersService.restoreUser(id);
      await this.fetchUsers();
    },

    async assignRole(id, payload) {
      await usersService.assignRole(id, payload);
      await this.fetchUsers();
    },
  },
});