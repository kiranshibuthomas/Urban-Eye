import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { InlineSpinner } from '../components/LoadingSpinner';
import AuthLayout from '../components/AuthLayout';
import { getApiURL } from '../utils/apiConfig';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiURL()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        toast.success('Password reset code sent to your email!');
      } else {
        setError(data.message || 'Failed to send password reset code');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleContinueToOTP = () => {
    navigate('/verify-password-reset-otp', { 
      state: { email: email.toLowerCase().trim() }
    });
  };

  return (
    <AuthLayout isLogin={false}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="space-y-4 sm:space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          >
            <FaCity className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900 mb-1">UrbanEye</h1>
          <p className="text-xs sm:text-sm text-primary-600 mb-4">Smart Civic Management Platform</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">
            {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
          </h2>
          <p className="text-sm text-primary-600">
            {isSubmitted 
              ? 'We\'ve sent a password reset code to your email address.'
              : 'Enter your email address and we\'ll send you a code to reset your password.'
            }
          </p>
        </div>

        {!isSubmitted ? (
          /* Email Input Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all duration-200 pr-10"
                  placeholder="Enter your email address"
                />
                <FiMail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <InlineSpinner />
                  <span className="ml-2">SENDING CODE...</span>
                </>
              ) : (
                'SEND RESET CODE'
              )}
            </button>
          </form>
        ) : (
          /* Success State */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMail className="text-green-600 w-6 h-6" />
              </div>
              <p className="text-sm text-green-800 font-medium">
                Password reset code sent to:
              </p>
              <p className="text-sm text-green-700 font-semibold mt-1">
                {email}
              </p>
            </div>

            <button
              onClick={handleContinueToOTP}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg"
            >
              CONTINUE TO VERIFY CODE
            </button>

            <div className="text-center">
              <p className="text-sm text-primary-600 mb-2">Didn't receive the code?</p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Try again with a different email
              </button>
            </div>
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={handleBackToLogin}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center mx-auto"
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </button>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
