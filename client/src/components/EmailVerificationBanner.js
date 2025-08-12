import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiX, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { InlineSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';

const EmailVerificationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const { user, resendVerification } = useAuth();

  // Don't show if user is verified or doesn't exist
  if (!user || user.isEmailVerified || !isVisible) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerification();
      
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <FiMail className="w-5 h-5 text-amber-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  Verify your email address
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Please check your email and click the verification link to complete your registration.
                </p>
                <div className="mt-3 flex items-center space-x-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-medium rounded-md text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isResending ? (
                      <>
                        <InlineSpinner size="sm" />
                        <span className="ml-1">Sending...</span>
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="w-3 h-3 mr-1" />
                        Resend Email
                      </>
                    )}
                  </button>
                  <span className="text-xs text-amber-600">
                    Didn't receive the email?
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors duration-200"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailVerificationBanner;
