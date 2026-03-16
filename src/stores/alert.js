import { defineStore } from 'pinia';
import { useAlert } from '@/composables/alerts';

export const useAlertStore = defineStore('alert', {
    state: () => ({
        alerts: [],
    }),

    actions: {
        /**
         * Show alert using the alertifyPayload format from API
         * @param {Object} alertifyPayload - Alert payload from API response
         * @param {string} alertifyPayload.type - Alert type (success, error, warning, info)
         * @param {string} alertifyPayload.title - Alert title
         * @param {string} alertifyPayload.message - Alert message
         */
        show(alertifyPayload) {
            const { toastSuccess, toastError, toastWarning, showAlert } = useAlert();

            if (!alertifyPayload) {
                console.warn('Invalid alertifyPayload:', alertifyPayload);
                return;
            }

            // API format: { theme: 'success', type: 'toast'|'alert', message: '...' }
            // Legacy:     { type: 'success', message: '...' }
            const alertLevel = alertifyPayload.theme || alertifyPayload.type;
            const displayType = alertifyPayload.theme ? alertifyPayload.type : 'toast'; // legacy has no theme, default to toast
            const { title, message, options = {} } = alertifyPayload;

            if (!alertLevel) {
                console.warn('No alert level (theme/type) in alertifyPayload:', alertifyPayload);
                return;
            }

            // Store alert in history
            this.alerts.push({
                type: alertLevel,
                title,
                message,
                timestamp: new Date().toISOString(),
            });

            // Keep only last 50 alerts
            if (this.alerts.length > 50) {
                this.alerts.shift();
            }

            // Route based on display type
            if (displayType === 'alert') {
                // SweetAlert2 popup
                const iconMap = {
                    success: 'success',
                    error: 'error',
                    warning: 'warning',
                    info: 'info',
                    danger: 'error',
                };
                showAlert({
                    icon: iconMap[alertLevel.toLowerCase()] || 'info',
                    title: title || alertLevel.charAt(0).toUpperCase() + alertLevel.slice(1),
                    text: message,
                    confirmButtonText: 'OK',
                    customClass: {
                        confirmButton: 'btn btn-primary m-1',
                    },
                    buttonsStyling: false,
                    ...options,
                });
            } else {
                // iziToast notification (default)
                switch (alertLevel.toLowerCase()) {
                    case 'success':
                        toastSuccess(title || 'Success', message || 'Operation completed successfully');
                        break;
                    case 'error':
                    case 'danger':
                        toastError(title || 'Error', message || 'An error occurred');
                        break;
                    case 'warning':
                        toastWarning(title || 'Warning', message || 'Please note');
                        break;
                    case 'info':
                        toastSuccess(title || 'Info', message || '');
                        break;
                    default:
                        toastSuccess(title || 'Notification', message || '');
                }
            }
        },

        /**
         * Show a success alert
         */
        success(title, message) {
            this.show({ type: 'success', title, message });
        },

        /**
         * Show an error alert
         */
        error(title, message) {
            this.show({ type: 'error', title, message });
        },

        /**
         * Show a warning alert
         */
        warning(title, message) {
            this.show({ type: 'warning', title, message });
        },

        /**
         * Show an info alert
         */
        info(title, message) {
            this.show({ type: 'info', title, message });
        },

        /**
         * Clear alert history
         */
        clearHistory() {
            this.alerts = [];
        },
    },

    getters: {
        /**
         * Get recent alerts
         */
        recentAlerts: (state) => (limit = 10) => {
            return state.alerts.slice(-limit).reverse();
        },
    },
});
