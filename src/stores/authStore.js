import { defineStore } from "pinia";
import { authService } from "@/services/authService";
import { useAlert } from "@/composables/alerts"; // Import alerts

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

    // LOGIN
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

    // SIGNUP
    async signup(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await authService.signup(payload);
        
        // Success Toast
        toastSuccess("Account Created", "Please sign in with your new credentials.");
        return true; // Explicitly return true for the component logic
      } catch (err) {
        const msg = err.response?.data?.detail || "Registration failed";
        toastError("Signup Error", msg);
        throw err;
      }
    },

    // LOGOUT
    async logout() {
      const { toastInfo } = useAlert();
      try {
        await authService.logout();
      } catch (err) {
        console.warn("Logout request failed");
      } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        this.clearAuth();
        toastInfo("Signed Out", "You have been logged out successfully.");
      }
    },

    setUser(user) {
      this.user = {
        ...user,
        roles: user.roles || [],
      };
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
    },
  },
});