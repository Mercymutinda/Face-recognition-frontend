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
        enabled: false,
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
      registerEndpoint: "/auth/signup",
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

      const encryptedToken = localStorage.getItem("user.token");
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

      localStorage.setItem("user.token", encryptedToken);
      localStorage.setItem("user.username", username);
      localStorage.setItem("loggedIn", true);

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
          last_login_at,
          last_login_ip,
        } = userData;
        this.user.menus = menus;
        this.user.permissions = permissions;
        this.user.profile = profile;
        if (username) this.user.username = username;

        if (this.config.fetchData.cache) {
          const encryptedMenus = encrypt(JSON.stringify(menus));
          const encryptedPermissions = encrypt(JSON.stringify(permissions));
          localStorage.setItem("user.menus", encryptedMenus);
          localStorage.setItem("user.permissions", encryptedPermissions);
          if (profile) {
            localStorage.setItem(
              "user.profile",
              encrypt(JSON.stringify(profile))
            );
          }
        }
      } else {
        console.warn("User data is missing or invalid.");
      }
    },

    loadCachedUserData() {
      const encryptedMenus = localStorage.getItem("user.menus");
      const encryptedPermissions = localStorage.getItem("user.permissions");
      const encryptedProfile = localStorage.getItem("user.profile");

      if (encryptedMenus) {
        try {
          this.user.menus = JSON.parse(decrypt(encryptedMenus));
        } catch (error) {
          console.error("Failed to decrypt menus:", error);
        }
      }

      if (encryptedPermissions) {
        try {
          this.user.permissions = JSON.parse(decrypt(encryptedPermissions));
        } catch (error) {
          console.error("Failed to decrypt permissions:", error);
        }
      }

      if (encryptedProfile) {
        try {
          this.user.profile = JSON.parse(decrypt(encryptedProfile));
        } catch (error) {
          console.error("Failed to decrypt profile:", error);
        }
      }
    },

    getMenus() {
      const encryptedMenus = localStorage.getItem("user.menus");
      if (!encryptedMenus) return {};

      try {
        return JSON.parse(decrypt(encryptedMenus));
      } catch (error) {
        console.error("Failed to decrypt menus:", error);
        return {};
      }
    },

    getPermissions() {
      const encryptedPermissions = localStorage.getItem("user.permissions");
      if (!encryptedPermissions) return [];

      try {
        return JSON.parse(decrypt(encryptedPermissions));
      } catch (error) {
        console.error("Failed to decrypt permissions:", error);
        return [];
      }
    },

    removeToken() {
      this.user.token = null;
      this.user.username = null;
      this.user.isAuthenticated = false;
      this.user.menus = {};
      this.user.permissions = [];

      localStorage.removeItem("user.token");
      localStorage.removeItem("user.username");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("user.menus");
      localStorage.removeItem("user.permissions");

      if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
      if (this.autoLogoutTimer) clearInterval(this.autoLogoutTimer);
    },

    setIp(ipAddr) {
      this.user.ipAddr = ipAddr;
      sessionStorage.setItem("ipA", ipAddr);
    },

    logOutRequest() {
      this.removeToken();
      localStorage.removeItem("user.menus");
      localStorage.removeItem("user.permissions");
    },

    async logOut(options = {}) {
      const { redirect = { name: "/auth/login" }, callApi = true } = options;
      const { toastSuccess, toastError } = useAlert();

      if (callApi) {
        const { request } = useApi("/auth/logout", {
          method: "POST",
          autoFetch: false,
        });

        try {
          const response = await request({ device: "web" });
          const successMessage =
            response?.dataPayload?.alertify?.message ||
            response?.alertifyPayload?.message ||
            response?.message ||
            "Logged out successfully.";
          toastSuccess("Success", successMessage);
          console.log("Logout API call successful");
        } catch (e) {
          const errorMessage =
            e?.errorPayload?.message ||
            e?.alertifyPayload?.message ||
            e?.message ||
            "Logout failed.";
          toastError("Logout failed", errorMessage);
          console.error("Logout API failed:", e);
        }
      }

      this.removeToken();

      if (redirect) {
        router.push(redirect);
      }
    },

    setupTokenRefresh() {
      if (this.refreshTimeout) clearTimeout(this.refreshTimeout);

      if (!this.user.token) return;

      const decoded = decodeJWT(this.user.token);
      if (!decoded || !decoded.exp) return;

      const expiryTime = decoded.exp * 1000;
      const remainingTime = expiryTime - Date.now();
      if (remainingTime <= 0) return;

      const configuredBuffer = this.config.refresh.bufferTime;
      const minimumBuffer = 5000;
      const dynamicBuffer = Math.floor(remainingTime * 0.2);
      const effectiveBuffer = Math.max(
        minimumBuffer,
        Math.min(configuredBuffer, dynamicBuffer)
      );

      let refreshTime = remainingTime - effectiveBuffer;

      if (refreshTime < 1000) {
        refreshTime = Math.max(1000, Math.floor(remainingTime * 0.7));
      }

      this.refreshTimeout = setTimeout(async () => {
        try {
          const newToken = await this.refreshToken();
          if (newToken) {
            this.setToken(newToken, this.user.username);
            if (this.config.refresh.enabledInBackground) {
              console.log("Token refreshed in background");
            }
          }
        } catch (e) {
          console.error("Token refresh failed:", e);
          if (this.config.autoLogout.enabled) {
            await this.logOut();
          }
        }
      }, refreshTime);
    },

    async refreshToken() {
      const { data: responseData, request } = useApi(
        this.config.refreshEndpoint,
        {
          method: "POST",
          autoFetch: false,
        }
      );

      try {
        await request();
        return (
          responseData.value?.dataPayload?.data?.access_token ||
          responseData.value?.dataPayload?.token ||
          responseData.value?.token ||
          responseData.value?.access_token
        );
      } catch (err) {
        throw err;
      }
    },

    setupAutoLogout() {
      if (this.autoLogoutTimer) clearInterval(this.autoLogoutTimer);

      this.autoLogoutTimer = setInterval(() => {
        if (!this.user.token) return;

        const decoded = decodeJWT(this.user.token);
        if (!decoded || !decoded.exp) return;

        if (Date.now() >= decoded.exp * 1000) {
          this.logOutRequest();
          console.log("Auto-logout due to token expiry");
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
        if (background) {
          console.log("User data fetched in background");
        }
      } catch (e) {
        console.error("Failed to fetch user data:", e);
        if (this.config.autoLogout.enabled) {
          await this.logOutRequest();
        }
      }
    },

    hasUserData() {
      return (
        Object.keys(this.user?.menus ?? {}).length > 0 ||
        (this.user?.permissions?.length ?? 0) > 0
      );
    },
// login
   // Login method - Raw Axios bypass for OAuth2 Form Data
   async login(credentials) {
    this.loading = true;

    try {
      // 1. Format the credentials specifically for FastAPI OAuth2
      const formData = new URLSearchParams();
      formData.append("username", credentials.username);
      formData.append("password", credentials.password);

      // 2. Use raw axios to bypass the global JSON header in axiosInstance
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + this.config.loginEndpoint,
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const payload = response.data;
      const token = payload.access_token;

      if (token) {
        const username = credentials.username || credentials.email || "User";
        this.setToken(token, username);
      } else {
        throw new Error("No token found in login response.");
      }

      // 3. Auto-fetch user data to complete the auth cycle
      if (this.config.fetchData.enabled && !this.hasUserData()) {
        try {
          await this.fetchUser({ background: false });
        } catch (e) {
          console.warn("Failed to auto-fetch user profile", e);
        }
      }

      // Return a mock payload structure to satisfy SignIn3View's success message
      return { dataPayload: { alertify: { message: "Welcome back!" } } };

    } catch (error) {
      // Format FastAPI's error specifically for your SignIn3View's UI
      let errorMsg = "Login failed. Please check your credentials.";
      
      if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      }

      throw { errorPayload: { message: errorMsg } };
    } finally {
      this.loading = false;
    }
  },
    async logout() {
      await this.logOut({ callApi: true });
    },
  },
});
