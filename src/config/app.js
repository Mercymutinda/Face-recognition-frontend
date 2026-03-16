/**
 * Application Configuration
 * Central configuration for the Afya365 application
 */
const env = import.meta.env;

const getEnv = (primaryKey, fallbackKey, defaultValue = "") => {
    return env[primaryKey] ?? env[fallbackKey] ?? defaultValue;
};

const isTrue = (value) => String(value).toLowerCase() === "true";

export default {
    name: getEnv("VITE_APP_NAME", "APP_NAME", "Afya365"),
    version: getEnv("VITE_VERSION", "VERSION", "1.0.0"),
    environment: getEnv("VITE_ENVIRONMENT", "ENVIRONMENT", "development"),

    // API Configuration
    api: {
        baseURL: getEnv("VITE_API_BASE_URL", "API_BASE_URL", "http://localhost:8000"),
        timeout: 30000, // 30 seconds
        redirectErrorPages: true, // Redirect to error pages on specific status codes
    },

    // Authentication
    auth: {
        tokenKey: getEnv("VITE_TOKEN_KEY", "TOKEN_KEY", "token"),
        userKey: getEnv("VITE_USER_KEY", "USER_KEY", "user"),
        sessionTimeout: parseInt(getEnv("VITE_SESSION_TIMEOUT", "SESSION_TIMEOUT", "30"), 10) || 30, // minutes
    },

    // Safe routes (routes that don't require authentication)
    safeRoutes: getEnv("VITE_SAFE_ROUTES", "SAFE_ROUTES", "").split(",").filter(Boolean),

    // Feature flags
    features: {
        cache: isTrue(getEnv("VITE_ENABLE_CACHE", "ENABLE_CACHE", "false")),
        offlineMode: isTrue(getEnv("VITE_ENABLE_OFFLINE_MODE", "ENABLE_OFFLINE_MODE", "false")),
        pwa: isTrue(getEnv("VITE_ENABLE_PWA", "ENABLE_PWA", "false")),
    },

    // Debug mode
    debug: isTrue(getEnv("VITE_DEBUG_MODE", "DEBUG_MODE", "false")),
};
