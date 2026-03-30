// src/composables/alerts.js
import alertUtil from "@/utils/alerts";

export function useAlert() {
  // Logic for toasts
  const toastSuccess = (title, message) => {
    alertUtil.toast.success({ title, message });
  };

  const toastError = (title, message) => {
    alertUtil.toast.error({ title, message });
  };

  const toastWarning = (title, message) => {
    alertUtil.toast.warning({ title, message });
  };

  // Logic for dialogs/popups
  const confirmAction = async (title, text) => {
    return await alertUtil.dialog.confirm(title, text);
  };

  const showAlert = (options) => {
    alertUtil.dialog.fire(options);
  };

  return {
    toastSuccess,
    toastError,
    toastWarning,
    confirmAction,
    showAlert,
  };
}
