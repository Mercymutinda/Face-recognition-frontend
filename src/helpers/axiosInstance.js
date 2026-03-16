import axios from 'axios';
import { encrypt, decrypt } from '@/helpers/crypto';
import appConfig from '@/config/app';
import router from "@/router";

let isRefreshing = false;
let requestQueue = [];

// Create axios instance with default config from afya365.cfg
const axiosInstance = axios.create({
    baseURL: appConfig.api.baseURL,
    timeout: appConfig.api.timeout,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Encryption Helpers
function encryptToken(token) {
    return encrypt(token);
}

function decryptToken(encryptedToken) {
    return decrypt(encryptedToken);
}

// Async logout broadcast
async function broadcastLogout() {
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();

    authStore.logOutRequest();

    if (router.currentRoute.value.name !== 'auth/login') {
        router.push({ name: '/auth/login' });
    }
}

// Token Refresh Handler
function processQueue(error, token = null) {
    requestQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token);
    });

    requestQueue = [];
}

// Request Interceptor - add encrypted token
axiosInstance.interceptors.request.use(
    async (config) => {
        if (config.skipAuth) return config;

        const encryptedToken = localStorage.getItem('user.token');
        const token = decryptToken(encryptedToken);

        if (token && !config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor - handle errors and token refresh
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const { config, response } = error;
        const originalRequest = config;

        // Handle 401 with token refresh
        if (response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    requestQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { useAuthStore } = await import('@/stores/auth');
                const authStore = useAuthStore();

                const newToken = await authStore.refreshToken();
                if (newToken) {
                    authStore.setToken(newToken, authStore.user.username);
                    processQueue(null, newToken);

                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (err) {
                processQueue(err, null);
                await broadcastLogout();
            } finally {
                isRefreshing = false;
            }
        }

        // Handle 403 forbidden
        if (response?.status === 403) {
            console.error('Forbidden access');
            await broadcastLogout();
        }

        // Handle other 401 cases
        if (response?.status === 401) {
            await broadcastLogout();
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
