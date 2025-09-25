import toast from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import React from 'react';
import SimpleAnimatedToast from '../components/SimpleAnimatedToast';

// Custom toast function for success messages
export const showSuccessToast = (message, options = {}) => {
  const {
    duration = 4000,
    position = 'top-right',
    theme = 'auto'
  } = options;

  // Create a container for our custom toast
  const toastContainer = document.createElement('div');
  toastContainer.style.position = 'fixed';
  toastContainer.style.zIndex = '9999';
  
  // Position the toast
  switch (position) {
    case 'top-right':
      toastContainer.style.top = '20px';
      toastContainer.style.right = '20px';
      break;
    case 'top-left':
      toastContainer.style.top = '20px';
      toastContainer.style.left = '20px';
      break;
    case 'top-center':
      toastContainer.style.top = '20px';
      toastContainer.style.left = '50%';
      toastContainer.style.transform = 'translateX(-50%)';
      break;
    case 'bottom-right':
      toastContainer.style.bottom = '20px';
      toastContainer.style.right = '20px';
      break;
    case 'bottom-left':
      toastContainer.style.bottom = '20px';
      toastContainer.style.left = '20px';
      break;
    case 'bottom-center':
      toastContainer.style.bottom = '20px';
      toastContainer.style.left = '50%';
      toastContainer.style.transform = 'translateX(-50%)';
      break;
    default:
      toastContainer.style.top = '20px';
      toastContainer.style.right = '20px';
  }

  document.body.appendChild(toastContainer);

  // Create root and render our custom toast
  const root = createRoot(toastContainer);
  
  const handleClose = () => {
    root.unmount();
    document.body.removeChild(toastContainer);
  };

  root.render(
    <SimpleAnimatedToast
      message={message}
      onClose={handleClose}
      duration={duration}
    />
  );

  // Return a toast ID for potential cancellation
  return `custom-toast-${Date.now()}`;
};

// Enhanced toast functions with custom animations
export const customToast = {
  success: (message, options = {}) => {
    return showSuccessToast(message, options);
  },
  
  // Keep other toast types as regular react-hot-toast
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 4000,
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      },
      ...options
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      },
      ...options
    });
  },
  
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, messages, {
      style: {
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      },
      ...options
    });
  }
};

export default customToast;
