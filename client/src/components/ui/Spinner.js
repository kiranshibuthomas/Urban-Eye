import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'default', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-4"
      >
        {/* Spinner */}
        <div className={`loading-spinner ${sizeClasses[size]}`}></div>
        
        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 text-sm font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

// Inline loading spinner for buttons
export const InlineSpinner = ({ size = 'small' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return <div className={`loading-spinner ${sizeClasses[size]}`}></div>;
};

export default LoadingSpinner;
