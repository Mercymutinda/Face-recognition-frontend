import { defineStore } from "pinia";
import { encrypt, decrypt, decodeJWT } from "@/helpers/crypto";
import { useApi } from "@/helpers/useApi";
import router from "@/router";
import { useAlert } from "@/composables/alerts";
import axios from "axios"; 

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: {
      isAuthenticated: false,
      username: null,
      token: null,
      ipAddr: null,
      menus: {},
      permissions: [],
      profile: null,
    },
    config: {
      refresh: {
        enabled: true,
        enabledInBackground: true,
        bufferTime: 2 * 60 * 1000,
      },
      fetchData: {
        enabled: false, // Set to true if you want it to auto-fetch profile on load
        cache: true,
        enabledInBackground: true,
        endpoint: "/users/me",
      },
      autoLogout: {
        enabled: true,
        checkInterval: 60 * 1000,
      },
      rolesKey: "permissions",
      loginEndpoint: "/auth/login",
      registerEndpoint: "/auth/register", // Updated to match your backend reference
      logoutEndpoint: "/auth/logout",
      userEndpoint: "/users/me",
      refreshEndpoint: "/auth/refresh",
    },
    refreshTimeout: null,
    autoLogoutTimer: null,
    loading: false,
  }),
  
  getters: {
    isAuthenticated: (state) => state.user.isAuthenticated,
    hasRole: (state) => (roleName) => {
      return state.user?.permissions?.includes(roleName);
    },
  },

  actions: {
    initStore(customConfig = {}) {
      this.config = { ...this.config, ...customConfig };

      // SECURE: Use sessionStorage so it dies when the browser closes
      const encryptedToken = sessionStorage.getItem("user.token");
      
      // UX: Use localStorage for username ONLY so the Lock Screen remembers them tomorrow
      const storedUsername = localStorage.getItem("user.username");

      if (encryptedToken && storedUsername) {
        try {
          const token = decrypt(encryptedToken);
          this.setToken(token, storedUsername);
          console.log("Store initialized with decrypted token");
        } catch (e) {
          console.warn("Failed to decrypt token:", e);
          this.removeToken();
        }
      } else {
        console.log("No stored token or username found");
      }

      if (this.config.fetchData.cache) {
        this.loadCachedUserData();
      }

      if (this.config.refresh.enabled) {
        this.setupTokenRefresh();
      }

      if (this.config.autoLogout.enabled) {
        this.setupAutoLogout();
      }

      if (this.config.fetchData.enabled && !this.hasUserData()) {
        this.fetchUser({
          background: this.config.fetchData.enabledInBackground,
        });
      }
    },

    setToken(token, username) {
      const encryptedToken = encrypt(token);
      this.user.token = token;
      this.user.username = username;
      this.user.isAuthenticated = true;

      // SECURE: sessionStorage
      sessionStorage.setItem("user.token", encryptedToken);
      sessionStorage.setItem("loggedIn", true);
      
      // UX: localStorage for memory
      localStorage.setItem("user.username", username);

      if (this.config.refresh.enabled) {
        this.setupTokenRefresh();
      }
    },

    setUserData(userData) {
      if (userData) {
        const {
          menus = {},
          permissions = [],
          profile = null,
          username,
        } = userData;
        
        this.user.menus = menus;
        this.user.permissions = permissions;
        this.user.profile = profile;
        if (username) this.user.username = username;

        if (this.config.fetchData.cache) {
          // SECURE: sessionStorage
          sessionStorage.setItem("user.menus", encrypt(JSON.stringify(menus)));
          sessionStorage.setItem("user.permissions", encrypt(JSON.stringify(permissions)));
          if (profile) {
            sessionStorage.setItem("user.profile", encrypt(JSON.stringify(profile)));
          }
        }
      }
    },

    loadCachedUserData() {
      // SECURE: sessionStorage
      const encryptedMenus = sessionStorage.getItem("user.menus");
      const encryptedPermissions = sessionStorage.getItem("user.permissions");
      const encryptedProfile = sessionStorage.getItem("user.profile");

      if (encryptedMenus) {
        try { this.user.menus = JSON.parse(decrypt(encryptedMenus)); } catch (e) {}
      }
      if (encryptedPermissions) {
        try { this.user.permissions = JSON.parse(decrypt(encryptedPermissions)); } catch (e) {}
      }
      if (encryptedProfile) {
        try { this.user.profile = JSON.parse(decrypt(encryptedProfile)); } catch (e) {}
      }
    },

    removeToken() {
      this.user.token = null;
      this.user.isAuthenticated = false;
      this.user.menus = {};
      this.user.permissions = [];
      // Notice we DO NOT clear user.username so the Lock Screen can use it!

      sessionStorage.removeItem("user.token");
      sessionStorage.removeItem("loggedIn");
      sessionStorage.removeItem("user.menus");
      sessionStorage.removeItem("user.permissions");
      sessionStorage.removeItem("user.profile");

      if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
      if (this.autoLogoutTimer) clearInterval(this.autoLogoutTimer);
    },

    // ------------------------------------------------------
    // CORE AUTH ROUTES (Raw Axios to manage Cookies directly)
    // ------------------------------------------------------

    async login(credentials) {
      this.loading = true;
      try {
        const formData = new URLSearchParams();
        formData.append("username", credentials.username);
        formData.append("password", credentials.password);

        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + this.config.loginEndpoint,
          formData,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            withCredentials: true // CRITICAL: Accepts the HttpOnly Refresh Cookie
          }
        );

        // Handle nested data structures depending on backend response wrapper
        const payload = response.data?.data?.[0] || response.data?.dataPayload?.data?.[0] || response.data;
        const token = payload.access_token;

        if (token) {
          const username = payload.username || credentials.username || "User";
          this.setToken(token, username);
          
          // Save roles/permissions from login payload if available
          if (payload.role || payload.permissions) {
              this.setUserData({
                  permissions: payload.permissions || [payload.role],
                  username: username
              });
          }
        } else {
          throw { response: { data: { detail: "No token found in response." } } };
        }

        if (this.config.fetchData.enabled && !this.hasUserData()) {
          this.fetchUser({ background: true });
        }

        // Let the backend dictate the success message
        const backendMsg = response.data?.message || response.data?.alertifyPayload?.message || "Welcome back!";
        return { success: true, message: backendMsg };

      } catch (error) {
        let errorMsg = "Login failed. Please check your credentials.";
        if (error.response?.data?.detail) {
          errorMsg = error.response.data.detail;
        } else if (error.response?.data?.errorPayload?.errors) {
            errorMsg = error.response.data.errorPayload.errors[0];
        }
        throw { errorPayload: { message: errorMsg } };
      } finally {
        this.loading = false;
      }
    },

    async register(userData) {
      this.loading = true;
      try {
        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + this.config.registerEndpoint,
          userData,
          { withCredentials: true }
        );
        
        const backendMsg = response.data?.message || response.data?.alertifyPayload?.message || "Account created successfully!";
        return { success: true, message: backendMsg };
      } catch (error) {
        let errorMsg = "Signup failed.";
        if (error.response?.data?.detail) {
          errorMsg = Array.isArray(error.response.data.detail) 
            ? error.response.data.detail[0].msg 
            : error.response.data.detail;
        } else if (error.response?.data?.errorPayload?.errors) {
            errorMsg = error.response.data.errorPayload.errors[0];
        }
        return { success: false, error: errorMsg };
      } finally {
        this.loading = false;
      }
    },

    async refreshToken() {
      try {
        // Send an empty request. Browser automatically attaches the secure HttpOnly cookie.
        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + this.config.refreshEndpoint,
          {},
          { withCredentials: true }
        );

        const payload = response.data?.data?.[0] || response.data?.dataPayload?.data?.[0] || response.data;
        return payload.access_token;
      } catch (err) {
        console.error("Refresh failed, forcing logout");
        this.removeToken();
        throw err;
      }
    },

    async logOut(options = {}) {
      const { redirect = { name: "auth-signin3" }, callApi = true } = options;
      const { toastSuccess, toastError } = useAlert();

      if (callApi) {
        try {
          // Tell backend to destroy the cookie and DB token
          const response = await axios.post(
              import.meta.env.VITE_API_BASE_URL + this.config.logoutEndpoint,
              {},
              { withCredentials: true }
          );
          
          const successMessage = response.data?.message || response.data?.alertifyPayload?.message || "Logged out successfully.";
          toastSuccess("Success", successMessage);
        } catch (e) {
          console.error("Logout API failed:", e);
        }
      }

      this.removeToken();

      if (redirect) {
        router.push(redirect);
      }
    },

    // ------------------------------------------------------
    // UTILITY TIMERS & API CALLS
    // ------------------------------------------------------

    setupTokenRefresh() {
      if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
      if (!this.user.token) return;

      const decoded = decodeJWT(this.user.token);
      if (!decoded || !decoded.exp) return;

      const remainingTime = (decoded.exp * 1000) - Date.now();
      if (remainingTime <= 0) return;

      const effectiveBuffer = Math.max(5000, Math.min(this.config.refresh.bufferTime, Math.floor(remainingTime * 0.2)));
      let refreshTime = remainingTime - effectiveBuffer;

      this.refreshTimeout = setTimeout(async () => {
        try {
          const newToken = await this.refreshToken();
          if (newToken) {
            this.setToken(newToken, this.user.username);
          }
        } catch (e) {
          if (this.config.autoLogout.enabled) await this.logOut();
        }
      }, refreshTime);
    },

    setupAutoLogout() {
      if (this.autoLogoutTimer) clearInterval(this.autoLogoutTimer);

      this.autoLogoutTimer = setInterval(() => {
        if (!this.user.token) return;
        const decoded = decodeJWT(this.user.token);
        if (decoded && Date.now() >= decoded.exp * 1000) {
          this.removeToken();
          router.push({ name: "auth-signin3" });
        }
      }, this.config.autoLogout.checkInterval);
    },

    async fetchUser(options = {}) {
      const { background = false, force = false } = options;
      if (!force && this.hasUserData()) return;

      const { data: responseData, request } = useApi(this.config.userEndpoint, {
        method: "GET",
        autoFetch: false,
      });

      try {
        await request();
        this.setUserData(responseData.value?.dataPayload || responseData.value);
      } catch (e) {
        if (this.config.autoLogout.enabled) {
          await this.logOut({ callApi: false });
        }
      }
    }
  },
});