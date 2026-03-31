//src/stores/authStore.js
import { defineStore } from "pinia";
import { authService } from "@/services/authService";

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
      // Normalize both to uppercase to prevent casing errors
      return this.user.roles.some(r => r.toUpperCase() === role.toUpperCase());
    },

    // LOGIN
    async login(payload) {
      try {
        const res = await authService.login(payload);

        this.accessToken = res.data.access_token;
        localStorage.setItem("accessToken", this.accessToken);

        this.setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(this.user));
        return res;
      } catch (err) {
        console.error("Login failed:", err);
        throw err;
      }
    },

    // SIGNUP
    async signup(payload) {
      try {
        return await authService.signup(payload);
      } catch (err) {
        console.error("Signup failed:", err);
        throw err;
      }
    },

    // REFRESH TOKEN
    async refreshToken() {
      try {
        const res = await authService.refresh();

        this.accessToken = res.data.access_token;

        return this.accessToken;
      } catch (err) {
        console.error("Refresh failed:", err);

        this.logout(); //allback
        throw err;
      }
    },

    // LOGOUT
    async logout() {
      try {
        await authService.logout();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      } catch (err) {
        console.warn("Logout request failed (continuing anyway)");
      }

      this.clearAuth();
    },

    //LOCK ACCOUNT
    async lockAccount(payload) {
      try {
        return await authService.lockAccount(payload);
      } catch (err) {
        console.error("Lock account failed:", err);
        throw err;
      }
    },

    //SET USER
    setUser(user) {
      this.user = {
        ...user,
        roles: user.roles || [],
      };
    },

    //CLEAR AUTH
    clearAuth() {
      this.user = null;
      this.accessToken = null;
    },
  },
});
