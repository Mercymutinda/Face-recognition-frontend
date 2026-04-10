// src/stores/authStore.js
import { defineStore } from "pinia";
import { authService } from "@/services/authService";
import { useAlert } from "@/composables/alerts";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
    accessToken: localStorage.getItem("accessToken") || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userCan: (state) => (role) => {
      if (!state.user?.roles) return false;
      return state.user.roles.some(r => r.toUpperCase() === role.toUpperCase());
    },
  },

  actions: {
    hasRole(role) {
      if (!this.user || !this.user.roles) return false;
      return this.user.roles.some(r => r.toUpperCase() === role.toUpperCase());
    },

    async login(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        const res = await authService.login(payload);
        this.accessToken = res.data.access_token;
        localStorage.setItem("accessToken", this.accessToken);
        this.setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(this.user));
        toastSuccess("Welcome", `Signed in as ${this.user.username}`);
        return true;
      } catch (err) {
        const msg = err.response?.data?.detail || "Invalid credentials";
        toastError("Login Failed", msg);
        throw err;
      }
    },

    async signup(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await authService.signup(payload);
        toastSuccess("Account Created", "Please sign in with your new credentials.");
        return true;
      } catch (err) {
        const msg = err.response?.data?.detail || "Registration failed";
        toastError("Signup Error", msg);
        throw err;
      }
    },

    // ADDED LOCK ACCOUNT ACTION
    async lockAccount() {
      // Clear the token so they are "logged out" security-wise
      this.accessToken = null;
      localStorage.removeItem("accessToken");
      // Notice we DO NOT clear "user". We keep it so the lock screen knows who they are.
    },

    async logout() {
      // FIXED: Changed toastInfo to toastSuccess
      const { toastSuccess } = useAlert();
      try {
        await authService.logout();
      } catch (err) {
        console.warn("Logout request failed");
      } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        this.clearAuth();
        toastSuccess("Signed Out", "You have been logged out successfully.");
      }
    },
    async refreshToken() {
      try {
        const res = await authService.refresh();
        this.accessToken = res.data.access_token;
        localStorage.setItem("accessToken", this.accessToken);
        return this.accessToken;
      } catch (err) {
        throw err;
      }
    },

    setUser(user) {
      this.user = { ...user, roles: user.roles || [] };
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
    },

  },
});