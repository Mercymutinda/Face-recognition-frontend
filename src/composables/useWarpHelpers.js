/**
 * Shared helper utilities used by Warp-generated pages.
 * Extracted to avoid duplicating logic across every generated view.
 */

/**
 * Replace `{id}` (or any `{param}`) in an endpoint string with a concrete value.
 * @param {string} endpoint - e.g. "/admin/access-log/{id}"
 * @param {string|number} id
 * @returns {string}
 */
export function withId(endpoint, id) {
    return String(endpoint || '').replace(/\{[^}]+\}/g, id);
}

const CRUD_SYSTEM_FIELDS = new Set([
    'created_at',
    'updated_at',
    'is_deleted',
    // common camelCase variants
    'createdAt',
    'updatedAt',
    'isDeleted',
]);

/**
 * Remove backend-managed fields from CRUD payloads.
 * Keeps the generated UIs from sending audit/soft-delete fields.
 */
export function stripCrudSystemFields(payload) {
    if (!payload || typeof payload !== 'object') return payload;

    const result = Array.isArray(payload) ? [...payload] : { ...payload };
    for (const key of Object.keys(result)) {
        if (CRUD_SYSTEM_FIELDS.has(key)) {
            delete result[key];
        }
    }
    return result;
}

/**
 * Normalise a backend error into `{ fieldErrors, message }`.
 * Works with the standard `errorPayload.errors` structure returned by the API.
 *
 * @param {Object} err - The raw error value from `useApi`
 * @returns {{ fieldErrors: Object, message: string }}
 */
export function parseBackendError(err) {
    const payload = err?.errorPayload || err || {};

    // `useApi` may provide:
    // - full response data (with `errorPayload`)
    // - an `errors` object
    // - an array of error strings
    // - a plain object mapping fields -> errors (when only `errorPayload.errors` is returned)
    let errors = payload?.errors ?? err?.errors;

    // A field-errors map has all values as strings or arrays-of-strings.
    // This avoids false-negatives when a form field is literally named "status".
    const looksLikeFieldErrorsObject = (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const entries = Object.entries(value);
        if (entries.length === 0) return false;
        return entries.every(([, v]) =>
            typeof v === 'string' ||
            (Array.isArray(v) && v.every((s) => typeof s === 'string'))
        );
    };

    if (errors == null && looksLikeFieldErrorsObject(payload)) {
        errors = payload;
    }

    if (Array.isArray(errors)) {
        return {
            fieldErrors: {},
            message: errors[0] || payload?.message || err?.message || 'Request failed.',
            isValidation: false,
        };
    }

    if (looksLikeFieldErrorsObject(errors)) {
        const normalized = {};
        for (const [key, value] of Object.entries(errors)) {
            normalized[key] = Array.isArray(value) ? (value[0] || '') : (value ?? '');
        }

        const isValidation = Object.keys(normalized).length > 0;
        return {
            fieldErrors: normalized,
            // If backend didn't provide a message, keep it empty so the UI relies on inline field errors.
            message: payload?.message || err?.message || '',
            isValidation,
        };
    }

    return {
        fieldErrors: {},
        message: payload?.message || err?.message || 'Request failed.',
        isValidation: false,
    };
}

/**
 * Extract and display the alertify payload from an API response,
 * falling back to a provided message.
 *
 * @param {Object} alertStore - The alert store instance
 * @param {Object} response - The raw API response data
 * @param {string} fallbackMessage - Fallback success message
 */
export function handleResponseAlert(alertStore, response, fallbackMessage) {
    const payload =
        response?.alertifyPayload ||
        response?.dataPayload?.alertify ||
        response?.data?.alertifyPayload ||
        response?.data?.dataPayload?.alertify;

    if (payload) {
        alertStore.show(payload);
    } else {
        alertStore.show({ theme: 'success', type: 'toast', message: fallbackMessage });
    }
}
