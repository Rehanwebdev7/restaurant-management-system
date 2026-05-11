import { toast } from 'react-toastify';

// Default toast configuration
const defaultConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Toast utility functions
export const showToast = {
  // Success toast
  success: (message, config = {}) => {
    toast.success(message, { ...defaultConfig, ...config });
  },

  // Error toast
  error: (message, config = {}) => {
    toast.error(message, { ...defaultConfig, ...config });
  },

  // Info toast
  info: (message, config = {}) => {
    toast.info(message, { ...defaultConfig, autoClose: 2000, ...config });
  },

  // Warning toast
  warning: (message, config = {}) => {
    toast.warning(message, { ...defaultConfig, ...config });
  },

  // Custom toast with icon
  successWithIcon: (message, icon = '', config = {}) => {
    toast.success(`${icon} ${message}`, { ...defaultConfig, ...config });
  },

  // Transaction success
  transactionSuccess: (message) => {
    toast.success(`${message}`, {
      ...defaultConfig,
      autoClose: 4000,
    });
  },

  // Transaction failed
  transactionFailed: (message) => {
    toast.error(`${message}`, {
      ...defaultConfig,
      autoClose: 4000,
    });
  },

  // Verification success
  verificationSuccess: (message) => {
    toast.success(`${message}`, {
      ...defaultConfig,
      autoClose: 2000,
    });
  },

  // Loading toast (returns toast id to update later)
  loading: (message) => {
    return toast.loading(message, {
      position: "top-right",
    });
  },

  // Update loading toast
  update: (toastId, type, message) => {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      ...defaultConfig,
    });
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

// Predefined messages
export const toastMessages = {
  // Top Up Request
  topUpSuccess: 'Top Up request created successfully!',
  topUpFailed: 'Failed to create Top Up request',
  
  // Verification
  tpinSuccess: 'T-PIN verified successfully!',
  tpinFailed: 'Invalid T-PIN. Please try again.',
  otpSuccess: 'OTP verified successfully!',
  otpFailed: 'Invalid OTP. Please try again.',
  
  // General
  cancelled: 'Transaction cancelled',
  saved: 'Changes saved successfully',
  deleted: 'Deleted successfully',
  updated: 'Updated successfully',
  
  // Errors
  networkError: 'Network error. Please try again.',
  serverError: 'Server error. Please contact support.',
  validationError: 'Please fill all required fields.',
};

export default showToast;

