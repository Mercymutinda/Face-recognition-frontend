import { ref } from 'vue';
import { useAlert } from '@/composables/alerts';

export function useBackendValidation() {
  const { toastError } = useAlert();
  const fieldErrors = ref({});

  const clearErrors = () => { fieldErrors.value = {}; };

  const handleApiError = (error) => {
    clearErrors();
    let toastMessage = "An unexpected error occurred.";

    if (error.response?.data) {
      const detail = error.response.data.detail;
      // Handle FastAPI's array of form errors
      if (error.response.status === 422 && Array.isArray(detail)) {
        toastMessage = "Please correct the errors in the form.";
        detail.forEach((err) => {
          const fieldName = err.loc[err.loc.length - 1];
          fieldErrors.value[fieldName] = err.msg;
        });
      } else if (detail) {
        toastMessage = typeof detail === 'string' ? detail : "Request failed.";
      }
    }
    toastError("Action Failed", toastMessage);
  };

  return { fieldErrors, clearErrors, handleApiError };
}