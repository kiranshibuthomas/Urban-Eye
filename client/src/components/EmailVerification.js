import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { InlineSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'expired'
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { token } = useParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated and verified
    if (isAuthenticated && user?.isEmailVerified) {
      const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard';
      navigate(redirectPath, { replace: true });
      return;
    }

    // Verify email if token is provided
    if (token) {
      handleVerification();
    } else {
      setVerificationStatus('error');
    }
  }, [token, isAuthenticated, user, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerification = async () => {
    try {
      const result = await verifyEmail(token);
      
      if (result.success) {
        setVerificationStatus('success');
        // Redirect after 3 seconds
        setTimeout(() => {
          if (isAuthenticated && user) {
            const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard';
            navigate(redirectPath, { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        }, 3000);
      } else {
        setVerificationStatus('error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerification();
      
      if (result.success) {
        setCountdown(60); // 60 second cooldown
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const getStatusContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return {
          icon: <FiRefreshCw className="w-16 h-16 text-blue-500 animate-spin" />,
          title: 'Verifying Your Email',
          message: 'Please wait while we verify your email address...',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      
      case 'success':
        return {
          icon: <FiCheck className="w-16 h-16 text-green-500" />,
          title: 'Email Verified Successfully!',
          message: 'Your email has been verified. You will be redirected shortly...',
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      
      case 'error':
        return {
          icon: <FiX className="w-16 h-16 text-red-500" />,
          title: 'Verification Failed',
          message: 'The verification link is invalid or has expired. Please try again.',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      
      default:
        return {
          icon: <FiMail className="w-16 h-16 text-gray-500" />,
          title: 'Email Verification',
          message: 'Please verify your email address.',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4"
          >
            <FaCity className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-1">UrbanEye</h1>
          <p className="text-sm text-white/80">Smart Civic Management Platform</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6"
            >
              {statusContent.icon}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className={`text-2xl font-bold mb-4 ${statusContent.color}`}
            >
              {statusContent.title}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-gray-600 mb-6 leading-relaxed"
            >
              {statusContent.message}
            </motion.p>

            {/* Loading spinner for verifying state */}
            {verificationStatus === 'verifying' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mb-6"
              >
                <InlineSpinner />
              </motion.div>
            )}

            {/* Error actions */}
            {verificationStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-4"
              >
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || countdown > 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isResending ? (
                    <>
                      <InlineSpinner />
                      <span className="ml-2">Sending...</span>
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <>
                      <FiMail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-full hover:bg-gray-50 transition-all duration-200"
                >
                  Back to Login
                </button>
              </motion.div>
            )}

            {/* Success actions */}
            {verificationStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-lg ${statusContent.bgColor} border ${statusContent.borderColor}`}>
                  <p className="text-sm text-gray-600">
                    Redirecting you to your dashboard...
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    if (isAuthenticated && user) {
                      const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard';
                      navigate(redirectPath, { replace: true });
                    } else {
                      navigate('/login', { replace: true });
                    }
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-full transition-all duration-200"
                >
                  Continue to Dashboard
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
