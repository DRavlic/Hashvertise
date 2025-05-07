import { toast, ToastOptions } from "react-toastify";
import { TOAST_DURATION_MS } from "./constants";

const defaultOptions: ToastOptions = {
  position: "bottom-right",
  autoClose: TOAST_DURATION_MS,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, { ...defaultOptions, ...options });
};

export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, { ...defaultOptions, ...options });
};

export const showWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, { ...defaultOptions, ...options });
};

export const showInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, { ...defaultOptions, ...options });
};

// Helper function to extract user-friendly error messages from errors
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "An unknown error occurred";
};
