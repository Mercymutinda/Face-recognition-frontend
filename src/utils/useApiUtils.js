import { ref, onMounted, onUnmounted } from 'vue';

// Cache storage with expiration
const cache = new Map();

/**
 * Set cache with TTL (Time To Live)
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const setCache = (key, value, ttl = 5 * 60 * 1000) => {
    cache.set(key, { value, expiry: Date.now() + ttl });
};

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if not found/expired
 */
export const getCache = (key) => {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
        cache.delete(key);
        return null;
    }
    return cached.value;
};

/**
 * Clear all cache entries for a specific URL
 * @param {string} baseUrl - Base URL to clear cache for
 */
export const clearCacheForUrl = (baseUrl) => {
    for (const key of cache.keys()) {
        if (key.startsWith(baseUrl)) {
            cache.delete(key);
        }
    }
};

/**
 * Clear all cache entries
 */
export const clearAllCache = () => {
    cache.clear();
};

/**
 * Get all cache keys
 * @returns {string[]} - Array of cache keys
 */
export const listCacheKeys = () => {
    return Array.from(cache.keys());
};

/**
 * Clear cache entries matching a pattern
 * @param {string|RegExp} pattern - Pattern to match
 */
export const clearCacheMatching = (pattern) => {
    for (const key of cache.keys()) {
        if (
            (typeof pattern === 'string' && key.includes(pattern)) ||
            (pattern instanceof RegExp && pattern.test(key))
        ) {
            cache.delete(key);
        }
    }
};

/**
 * Network status tracking
 */
export function useNetworkStatus() {
    const isOnline = ref(navigator.onLine);

    const updateOnlineStatus = () => {
        isOnline.value = navigator.onLine;
    };

    onMounted(() => {
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    });

    onUnmounted(() => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
    });

    return {
        isOnline,
    };
}

/**
 * Check if an error is retryable
 * @param {Error} err - Error object
 * @returns {boolean} - Whether the error is retryable
 */
export const shouldRetry = (err) => {
    return (
        err &&
        err.response &&
        [429, 503].includes(err.response.status)
    );
};

/**
 * Handle retry logic with exponential backoff
 * @param {Error} err - Error object
 * @param {number} attempt - Current attempt number
 * @param {number} retry - Maximum retry attempts
 * @param {number} retryDelay - Base delay between retries in ms
 * @param {Function} requestFn - Request function to retry
 * @returns {Promise<any>} - Result of retry or throws error
 */
export const handleRetry = async (err, attempt, retry, retryDelay, requestFn) => {
    if (attempt <= retry && shouldRetry(err)) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return requestFn(attempt + 1);
    }
    throw err; // Not retryable or max retries reached
};
