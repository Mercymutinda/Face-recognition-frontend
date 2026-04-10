import { defineStore } from "pinia";
import { usersService } from "@/services/usersService";
import { useAlert } from "@/composables/alerts";

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
        const { toastError } = useAlert();
        toastError("Error Fetching Users", err.response?.data?.detail || "Could not load users.");
      } finally {
        this.loading = false;
      }
    },

    // --- ADD THIS NEW ACTION ---
    async createUser(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await usersService.createUser(payload);
        toastSuccess("User Created", "New user has been successfully added.");
        await this.fetchUsers();
      } catch (err) {
        toastError("Creation Failed", err.response?.data?.detail || "Could not create user.");
        throw err; // Throw to stop the loading spinner in the modal
      }
    },
    // ---------------------------

    async updateUser(id, payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await usersService.updateUser(id, payload);
        toastSuccess("User Updated", "User details have been successfully updated.");
        await this.fetchUsers();
      } catch (err) {
        toastError("Update Failed", err.response?.data?.detail || "Could not update user.");
        throw err;
      }
    },

    async deleteUser(id) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await usersService.deleteUser(id);
        toastSuccess("User Suspended", "The user has been successfully disabled.");
        await this.fetchUsers();
      } catch (err) {
        toastError("Action Failed", err.response?.data?.detail || "Could not delete user.");
      }
    },

    async restoreUser(id) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await usersService.restoreUser(id);
        toastSuccess("User Restored", "The user account has been reactivated.");
        await this.fetchUsers();
      } catch (err) {
        toastError("Action Failed", err.response?.data?.detail || "Could not restore user.");
      }
    },

    async assignRole(id, payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await usersService.assignRole(id, payload);
        toastSuccess("Role Assigned", "The user role has been updated.");
        await this.fetchUsers();
      } catch (err) {
        toastError("Assignment Failed", err.response?.data?.detail || "Could not assign role.");
      }
    },
  },
});