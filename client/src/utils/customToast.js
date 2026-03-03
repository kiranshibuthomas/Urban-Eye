import toast from 'react-hot-toast';

// Standard toast styles
const baseStyle = {
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: '500',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

// Clean, standard toast functions
export const customToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      style: {
        ...baseStyle,
        background: '#fff',
        color: '#065f46',
        border: '1px solid #10b981',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
      ...options
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 4000,
      style: {
        ...baseStyle,
        background: '#fff',
        color: '#991b1b',
        border: '1px solid #ef4444',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
      ...options
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      style: {
        ...baseStyle,
        background: '#fff',
        color: '#1e40af',
        border: '1px solid #3b82f6',
      },
      ...options
    });
  },
  
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, messages, {
      style: {
        ...baseStyle,
        background: '#fff',
        border: '1px solid #e5e7eb',
      },
      ...options
    });
  },

  // Dismiss a specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },

  // Validation error toast with multiple errors
  validation: (errors, options = {}) => {
    const errorCount = Array.isArray(errors) ? errors.length : Object.keys(errors).length;
    const firstError = Array.isArray(errors) ? errors[0] : Object.values(errors)[0];
    
    const message = errorCount > 1 
      ? `${firstError} (${errorCount - 1} more error${errorCount > 2 ? 's' : ''})`
      : firstError;
    
    return toast.error(message, {
      duration: 5000,
      style: {
        ...baseStyle,
        background: '#fff',
        color: '#991b1b',
        border: '1px solid #ef4444',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
      ...options
    });
  }
};

export default customToast;
