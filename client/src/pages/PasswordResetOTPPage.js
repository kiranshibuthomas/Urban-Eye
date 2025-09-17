import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { InlineSpinner } from '../components/LoadingSpinner';
import AuthLayout from '../components/AuthLayout';
import toast from 'react-hot-toast';

const PasswordResetOTPPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    setError('');
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify-password-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          otp: otpString 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Code verified successfully!');
        navigate('/reset-password', { 
          state: { email: email },
          replace: true 
        });
      } else {
        setError(data.message || 'Invalid code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password reset code sent successfully!');
        setTimeLeft(600); // Reset timer to 10 minutes
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToForgotPassword = () => {
    navigate('/forgot-password');
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
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">Verify Reset Code</h2>
          <p className="text-sm text-primary-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-sm font-medium text-primary-800">{email}</p>
        </div>

        {/* OTP Input Fields */}
        <div className="space-y-4">
          <div className="flex justify-center space-x-2 sm:space-x-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                  digit ? 'border-red-500 bg-red-50' : 'border-primary-200 bg-primary-100'
                } focus:border-red-500 focus:ring-red-200`}
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-primary-600">
                Code expires in <span className="font-medium text-red-600">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">Code has expired</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerifyOTP}
          disabled={isLoading || otp.join('').length !== 6}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <InlineSpinner />
              <span className="ml-2">VERIFYING...</span>
            </>
          ) : (
            'VERIFY CODE'
          )}
        </button>

        {/* Resend OTP */}
        <div className="text-center">
          <p className="text-sm text-primary-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={!canResend || isResending}
            className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center justify-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <InlineSpinner />
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              <>
                <FiRefreshCw className="w-4 h-4 mr-1" />
                Resend Code
              </>
            )}
          </button>
        </div>

        {/* Back to Forgot Password */}
        <div className="text-center">
          <button
            onClick={handleBackToForgotPassword}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center mx-auto"
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Forgot Password
          </button>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default PasswordResetOTPPage;
