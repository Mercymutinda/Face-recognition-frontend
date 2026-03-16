import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";
import Swal from "sweetalert2";

// Standardized options for iziToast
const defaultIziOptions = {
  position: "topRight",
  timeout: 5000,
};

// Utility object containing library-specific implementations
const alertUtil = {
  // iziToast implementations
  toast: {
    success: (options) => iziToast.success({ ...defaultIziOptions, ...options }),
    error: (options) => iziToast.error({ ...defaultIziOptions, ...options }),
    warning: (options) => iziToast.warning({ ...defaultIziOptions, ...options }),
  },

  // SweetAlert2 implementations
  dialog: {
    fire: (options) => Swal.fire(options),
    confirm: (title, text) =>
      Swal.fire({
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        customClass: {
          confirmButton: "btn btn-success m-1",
          cancelButton: "btn btn-danger m-1",
        },
        buttonsStyling: false,
      }),
  },
};

export default alertUtil;
