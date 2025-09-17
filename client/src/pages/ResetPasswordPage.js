import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiCheck, FiX, FiLock } from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { InlineSpinner } from '../components/LoadingSpinner';
import AuthLayout from '../components/AuthLayout';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }
  }, [email, navigate]);

  // Real-time validation
  useEffect(() => {
    validateField('newPassword', formData.newPassword);
    checkPasswordStrength(formData.newPassword);
  }, [formData.newPassword]);

  useEffect(() => {
    validateField('confirmPassword', formData.confirmPassword);
  }, [formData.confirmPassword]);

  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors };
    
    switch (fieldName) {
      case 'newPassword':
        if (!value) {
          errors.newPassword = 'New password is required';
        } else if (value.length < 8) {
          errors.newPassword = 'Password must be at least 8 characters long';
        } else {
          delete errors.newPassword;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your new password';
        } else if (value !== formData.newPassword) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
  };

  const checkPasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
      feedback.push('Contains lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
      feedback.push('Contains uppercase letter');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
      feedback.push('Contains number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
      feedback.push('Contains special character');
    }

    setPasswordStrength({ score, feedback });
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'text-red-500';
    if (passwordStrength.score <= 3) return 'text-accent-600';
    if (passwordStrength.score <= 4) return 'text-teal-600';
    return 'text-teal-700';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Validate all fields
    validateField('newPassword', formData.newPassword);
    validateField('confirmPassword', formData.confirmPassword);

    // Check if there are any validation errors
    const hasErrors = Object.keys(validationErrors).length > 0;
    
    if (hasErrors) {
      toast.error('Please fix the validation errors before submitting');
      return false;
    }

    // Additional checks
    if (passwordStrength.score < 3) {
      toast.error('Please choose a stronger password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password reset successfully! You can now login with your new password.');
        navigate('/login', { replace: true });
      } else {
        toast.error(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFieldValid = (fieldName) => {
    return !validationErrors[fieldName] && formData[fieldName];
  };

  const isFieldInvalid = (fieldName) => {
    return validationErrors[fieldName];
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
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">Create New Password</h2>
          <p className="text-sm text-primary-600">
            Enter your new password for
          </p>
          <p className="text-sm font-medium text-primary-800">{email}</p>
        </div>

        {/* Password Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* New Password Field */}
          <div>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                  isFieldValid('newPassword') ? 'focus:ring-accent-500' : 
                  isFieldInvalid('newPassword') ? 'focus:ring-red-500' : 'focus:ring-accent-500'
                }`}
                placeholder="New Password"
              />
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-primary-400 hover:text-accent-500" />
                ) : (
                  <FiEye className="h-5 w-5 text-primary-400 hover:text-accent-500" />
                )}
              </button>
            </div>
            {validationErrors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.newPassword}</p>
            )}
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Password strength:</span>
                  <span className={`font-medium ${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score <= 3 ? 'bg-accent-500' :
                      passwordStrength.score <= 4 ? 'bg-teal-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-primary-600">
                  {passwordStrength.feedback.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <FiCheck className="w-3 h-3 text-accent-500 mr-1" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                  isFieldValid('confirmPassword') ? 'focus:ring-accent-500' : 
                  isFieldInvalid('confirmPassword') ? 'focus:ring-red-500' : 'focus:ring-accent-500'
                }`}
                placeholder="Confirm New Password"
              />
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FiEyeOff className="h-5 w-5 text-primary-400 hover:text-accent-500" />
                ) : (
                  <FiEye className="h-5 w-5 text-primary-400 hover:text-accent-500" />
                )}
              </button>
              {isFieldValid('confirmPassword') && (
                <FiCheck className="absolute right-12 top-1/2 transform -translate-y-1/2 text-accent-500 w-5 h-5" />
              )}
              {isFieldInvalid('confirmPassword') && (
                <FiX className="absolute right-12 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
              )}
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || Object.keys(validationErrors).length > 0 || passwordStrength.score < 3}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center mt-4 sm:mt-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <InlineSpinner />
                <span className="ml-2">RESETTING PASSWORD...</span>
              </>
            ) : (
              'RESET PASSWORD'
            )}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
