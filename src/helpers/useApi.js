import { ref, computed, watch } from 'vue';
import axios from 'axios';
import qs from 'qs';
import axiosInstance from '@/helpers/axiosInstance';
import { useAlertStore } from '@/stores/alert';
import appConfig from '@/config/app';
import {
    setCache,
    getCache,
    clearCacheForUrl,
    clearAllCache,
    listCacheKeys,
    clearCacheMatching,
    useNetworkStatus,
    shouldRetry,
    handleRetry,
} from '@/utils/useApiUtils';

/**
 * Advanced API composable for Vue 3 with comprehensive features
 * 
 * @param {string} baseUrl - API endpoint base URL
 * @param {Object} options - Configuration options
 * @returns {Object} - API state and methods
 * 
 * @example
 * const { data, request, isLoading, error } = useApi('/api/users', {
 *   method: 'GET',
 *   autoFetch: true,
 *   enableCache: true,
 *   autoAlert: true,
 * });
 */
export function useApi(baseUrl, {
    method = 'GET',
    options = {},
    autoFetch = true,
    enableCache = false,
    useAuth = true,
    manualToken = null,
    autoAlert = false,
    transform = null, // response transformation function
    onError = null, // Custom error handler
    onSuccess = null, // custom success handler
    onLoading = null, // onloading handler
    onComplete = null, // on complete handler
    onAbort = null, // onAbort event handler
    retry = 0, // number of retry attempts
    retryDelay = 1000, // time between retries in ms
    loadingDelay = 0, // delay before showing loading state in milliseconds
    timeout = 30000, // request timeout (30 seconds)
    mock = null, // mock mode for testing
    pagination = false, // enable pagination
    transformPagination = null, // custom pagination transformer
} = {}) {

    // Reactive state
    const data = ref(null);
    const error = ref(null);
    const status = ref('idle'); // idle | loading | success | error | refreshed | aborted
    const lastFetched = ref(null);
    let controller = null;
    const progress = ref(0); // Progress (0-100)

    // Pagination state
    const currentPage = ref(1);
    const perPage = ref(options.perPage || 10);
    const totalItems = ref(null);

    // Network status
    const { isOnline } = useNetworkStatus();

    /**
     * Mock API for testing/development
     */
    let hasRunOnce = false; // for `once` mode

    const mockApi = async (payload, queryParams) => {
        console.log('%c[MOCK MODE]', 'color: orange; font-weight: bold;', {
            payload,
            queryParams,
            method
        });

        if (typeof mock === 'object' && mock.once && hasRunOnce) {
            console.warn('[MOCK MODE] Once mode active – skipping mock, calling real API');
            return await request(payload, queryParams); // fallback to real API
        }

        status.value = 'loading';
        error.value = null;

        const delay = typeof mock === 'object' && mock?.delay !== undefined ? mock.delay : 500;
        const simulateError = typeof mock === 'object' && mock?.simulateError;
        const simulateProgress = typeof mock === 'object' && mock?.simulateProgress;

        // Simulate progress bar (optional)
        if (simulateProgress) {
            progress.value = 0;
            const steps = 10;
            const interval = delay / steps;
            for (let i = 1; i <= steps; i++) {
                await new Promise(resolve => setTimeout(resolve, interval));
                progress.value = Math.min(100, Math.round((i / steps) * 100));
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        if (simulateError) {
            status.value = 'error';
            error.value = mock?.error ?? ['Simulated API error'];
            data.value = null;
            return;
        }

        // Dynamic mock (function or data)
        data.value = typeof mock === 'function' ? mock(payload, queryParams, method) : mock;
        status.value = 'success';
        lastFetched.value = new Date().toISOString();

        if (mock?.once) {
            hasRunOnce = true;
        }
    };

    /**
     * Main request function
     */
    const request = async (payload = null, queryParams = {}, overridePage = null, attempt = 1) => {

        // Use mock if enabled
        if (mock) {
            return await mockApi(payload, queryParams);
        }

        // Cancel previous request if exists
        if (controller) {
            await new Promise(resolve => setTimeout(resolve, 50));
            controller.abort();
        }
        controller = new AbortController();

        // Delayed loading indicator
        if (loadingDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, loadingDelay));
        }

        status.value = 'loading';
        error.value = null;

        // Custom loading handler
        if (typeof onLoading === 'function') {
            onLoading();
        }

        try {
            // Build query string with pagination support
            const queryString = Object.keys(queryParams).length || pagination
                ? `?${qs.stringify({
                    ...queryParams,
                    ...(pagination ? {
                        page: overridePage ?? currentPage.value,
                        per_page: perPage.value
                    } : {})
                })}`
                : '';

            const url = `${baseUrl}${queryString}`;

            // Clear cache for non-GET requests
            if (enableCache && method.toUpperCase() !== 'GET') {
                clearCacheForUrl(baseUrl);
            }

            // Handle offline mode with cache
            if (!isOnline.value && enableCache && method.toUpperCase() === 'GET') {
                const cachedData = getCache(url);
                if (cachedData) {
                    const transformedData = transform ? transform(cachedData) : cachedData;
                    data.value = transformedData;

                    // Populate pagination state
                    if (pagination && cachedData?.meta) {
                        totalItems.value = cachedData.meta.total || null;
                        currentPage.value = cachedData.meta.current_page || currentPage.value;
                        perPage.value = cachedData.meta.per_page || perPage.value;
                    }

                    status.value = 'success';
                    if (onSuccess) onSuccess(transformedData);
                    return;
                } else {
                    error.value = ['Offline: No cached data available'];
                    status.value = 'error';
                    return;
                }
            }

            // Build request headers
            const headers = {
                ...(options.headers || {})
            };

            // Add manual Authorization header if token is provided
            if (manualToken) {
                headers['Authorization'] = `Bearer ${manualToken}`;
            }

            // Build axios config
            const config = {
                method,
                url,
                signal: controller.signal,
                headers,
                ...(useAuth ? {} : { skipAuth: true }),
                ...options,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                },
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                },
                timeout
            };

            if (payload) config.data = payload;

            // Make request
            const axiosToUse = useAuth ? axiosInstance : axios;
            const response = await axiosToUse(config);

            // Handle pagination
            if (pagination) {
                if (typeof transformPagination === 'function') {
                    const meta = transformPagination(response.data);
                    totalItems.value = meta.totalItems ?? totalItems.value;
                    currentPage.value = meta.currentPage ?? currentPage.value;
                    perPage.value = meta.perPage ?? perPage.value;
                } else if (response.data?.meta) {
                    totalItems.value = response.data.meta.total || null;
                    currentPage.value = response.data.meta.current_page || currentPage.value;
                    perPage.value = response.data.meta.per_page || perPage.value;
                }
            }

            // Auto-alert feature
            if (autoAlert) {
                const alertPayload = response.data?.alertifyPayload || response.data?.dataPayload?.alertify;
                if (alertPayload) {
                    const alertStore = useAlertStore();
                    alertStore.show(alertPayload);
                }
            }

            // Transform response data
            data.value = transform ? transform(response.data) : response.data;

            // Custom success handler
            if (typeof onSuccess === 'function') {
                onSuccess(data.value);
            }

            // Cache response for GET requests
            if (enableCache && method.toUpperCase() === 'GET') {
                setCache(url, response.data);
            }

            status.value = 'success';
            lastFetched.value = new Date().toISOString();

        } catch (err) {
            // Ignore if request was cancelled
            if (axios.isCancel(err)) return;

            // Retry handler
            if (retry && attempt <= retry) {
                return await handleRetry(err, attempt, retry, retryDelay, (nextAttempt) =>
                    request(payload, queryParams, overridePage, nextAttempt)
                );
            }

            // Custom error handling
            if (typeof onError === 'function') {
                const customHandledError = onError(err);
                if (customHandledError) {
                    error.value = customHandledError;
                    status.value = 'error';
                    data.value = null;
                    return;
                }
            }

            // Default error handling
            const responseData = err.response?.data || {};
            const statusCode = err.response?.status || 500;

            // Auto-alert for errors
            if (autoAlert) {
                const alertPayload = responseData?.alertifyPayload || responseData?.dataPayload?.alertify;
                if (alertPayload) {
                    const alertStore = useAlertStore();
                    alertStore.show(alertPayload);
                }
            }

            error.value = err.response?.data?.errorPayload?.errors ||
                err.response?.data?.errors ||
                err.response?.data ||
                [err.message];
            status.value = 'error';
            data.value = null;

        } finally {
            progress.value = 0;

            if (typeof onComplete === 'function') {
                onComplete({
                    status: status.value,
                    data: data.value,
                    error: error.value
                });
            }
        }
    };

    /**
     * Batch request function - execute multiple requests
     */
    const batchRequest = async (
        requests = [],
        {
            failFast = false,
            enableCache: batchCache = false,
            useAuth: batchAuth = true,
            onComplete: batchOnComplete = null,
            transform: batchTransform = null,
            autoAlert: batchAutoAlert = true,
        } = {}
    ) => {
        status.value = 'loading';
        error.value = null;
        data.value = [];
        progress.value = 0;

        controller = new AbortController();
        const axiosToUse = batchAuth ? axiosInstance : axios;
        const results = [];

        for (let i = 0; i < requests.length; i++) {
            const req = requests[i];
            const localTransform = req.transform ?? batchTransform;

            // Build request config
            const queryString = req.queryParams && Object.keys(req.queryParams).length
                ? `?${qs.stringify(req.queryParams)}`
                : '';
            const fullUrl = `${req.url}${queryString}`;

            // Check cache first for GET requests
            if (batchCache && req.method?.toUpperCase() === 'GET') {
                const cachedData = getCache(fullUrl);
                if (cachedData) {
                    results.push({
                        success: true,
                        data: cachedData,
                        requestName: req.requestName || null,
                        cached: true,
                    });
                    progress.value = Math.round(((i + 1) / requests.length) * 100);
                    continue;
                }
            }

            const config = {
                method: req.method?.toUpperCase() || 'GET',
                url: fullUrl,
                headers: {
                    ...(options.headers || {}),
                    ...req.headers,
                    ...(manualToken ? { Authorization: `Bearer ${manualToken}` } : {})
                },
                signal: controller.signal,
                ...(batchAuth ? {} : { skipAuth: true }),
                ...(req.payload ? { data: req.payload } : {}),
                timeout
            };

            try {
                const res = await axiosToUse(config);
                const transformed = localTransform ? localTransform(res.data) : res.data;

                // Cache response if enabled
                if (batchCache && config.method === 'GET') {
                    setCache(fullUrl, transformed);
                }

                // Auto-alert
                if (batchAutoAlert) {
                    const alertPayload = res.data?.alertifyPayload || res.data?.dataPayload?.alertify;
                    if (alertPayload) {
                        const alertStore = useAlertStore();
                        alertStore.show(alertPayload);
                    }
                }

                results.push({
                    success: true,
                    data: transformed,
                    requestName: req.requestName || null,
                });

            } catch (err) {
                const errorPayload = err.response?.data?.errorPayload?.errors ||
                    err.response?.data ||
                    [err.message];

                results.push({
                    success: false,
                    error: errorPayload,
                    statusCode: err.response?.status,
                    requestName: req.requestName || null,
                });

                if (failFast) break;
            }

            progress.value = Math.round(((i + 1) / requests.length) * 100);
        }

        data.value = results;
        status.value = 'success';
        lastFetched.value = new Date().toISOString();

        if (typeof batchOnComplete === 'function') {
            batchOnComplete({
                status: status.value,
                data: data.value,
                error: error.value,
            });
        }

        return results;
    };

    /**
     * Auto-fetch for GET requests when dependencies change
     */
    watch(() => [baseUrl, method, options], () => {
        if (method.toUpperCase() === 'GET' && autoFetch) {
            request();
        }
    }, { deep: true, immediate: true });

    /**
     * Refresh data (clear cache and re-fetch)
     */
    const refresh = async () => {
        status.value = 'loading';
        if (enableCache) clearCacheForUrl(baseUrl);
        await request();
        status.value = 'refreshed';
    };

    /**
     * Clear data and reset state
     */
    const clear = () => {
        data.value = null;
        error.value = null;
        status.value = 'idle';
    };

    /**
     * Abort current request
     */
    const abort = () => {
        if (controller) {
            controller.abort();
            controller = null;
            status.value = 'aborted';

            if (typeof onAbort === 'function') {
                onAbort();
            }
        }
    };

    // Pagination methods
    const nextPage = async () => {
        if (!pagination || (totalItems.value && currentPage.value * perPage.value >= totalItems.value)) return;
        currentPage.value += 1;
        await request(null, {}, currentPage.value);
    };

    const prevPage = async () => {
        if (!pagination || currentPage.value <= 1) return;
        currentPage.value -= 1;
        await request(null, {}, currentPage.value);
    };

    const goToPage = async (page) => {
        if (!pagination || page < 1) return;
        currentPage.value = page;
        await request(null, {}, page);
    };

    const setPerPage = async (newPerPage) => {
        if (!pagination) return;
        perPage.value = newPerPage;
        currentPage.value = 1;
        await request(null, {}, currentPage.value);
    };

    // Return API interface
    return {
        // State
        data,
        error,
        status,
        lastFetched,
        isOnline,

        // Methods
        request,
        batchRequest,
        refresh,
        clear,
        abort,

        // Cache methods
        clearAllCache,
        clearCacheForKey: (key) => {
            const cache = new Map();
            cache.delete(key);
        },
        listCacheKeys,
        clearCacheMatching,

        // Computed properties
        isLoading: computed(() => status.value === 'loading'),
        isError: computed(() => status.value === 'error'),
        isSuccess: computed(() => status.value === 'success'),
        progress: computed(() => progress.value),

        // Pagination (if enabled)
        ...(pagination ? {
            currentPage,
            perPage,
            totalItems,
            nextPage,
            prevPage,
            goToPage,
            setPerPage,
            totalPages: computed(() => {
                if (!totalItems.value) return null;
                return Math.ceil(totalItems.value / perPage.value);
            }),
            pages: computed(() => {
                if (!totalItems.value) return [];
                const total = Math.ceil(totalItems.value / perPage.value);
                return Array.from({ length: total }, (_, i) => i + 1);
            }),
        } : {})
    };
}
