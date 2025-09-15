import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { InlineSpinner } from '../components/LoadingSpinner';
import PhoneInput from '../components/PhoneInput';
import AuthLayout from '../components/AuthLayout';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
    phone: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  const { register, isAuthenticated, user, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  // Real-time validation
  useEffect(() => {
    validateField('name', formData.name);
  }, [formData.name]);

  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);

  useEffect(() => {
    validateField('password', formData.password);
    checkPasswordStrength(formData.password);
  }, [formData.password]);

  useEffect(() => {
    validateField('confirmPassword', formData.confirmPassword);
  }, [formData.confirmPassword]);

  useEffect(() => {
    validateField('phone', formData.phone);
  }, [formData.phone]);

  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors };
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters long';
        } else if (value.trim().length > 50) {
          errors.name = 'Name cannot exceed 50 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.name = 'Name can only contain letters and spaces';
        } else {
          delete errors.name;
        }
        break;

      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.email = 'Please enter a valid email address';
          } else {
            delete errors.email;
          }
        }
        break;

      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        } else {
          delete errors.password;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;

      case 'phone':
        if (value) {
          // Remove all non-digit characters
          const digitsOnly = value.replace(/[^\d]/g, '');
          
          // Check if we have exactly 10 digits
          if (digitsOnly.length !== 10) {
            errors.phone = 'Phone number must be exactly 10 digits';
          } else if (!/^\d{10}$/.test(digitsOnly)) {
            errors.phone = 'Phone number must contain only digits';
          } else {
            delete errors.phone;
          }
        } else {
          delete errors.phone;
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
    validateField('name', formData.name);
    validateField('email', formData.email);
    validateField('password', formData.password);
    validateField('confirmPassword', formData.confirmPassword);
    validateField('phone', formData.phone);

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
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        phone: formData.phone.trim() || undefined
      });

      if (result.success) {
        if (result.requiresEmailVerification) {
          // Show success message and redirect to login
          toast.success('Registration successful! Please check your email to verify your account.');
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please check your email to verify your account before logging in.' 
            }
          });
        } else {
          // Direct login (for Google users)
          const redirectPath = result.user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard';
          navigate(redirectPath, { replace: true });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
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
        {/* Header with UrbanEye Logo */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          >
            <FaCity className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900 mb-1">UrbanEye</h1>
          <p className="text-xs sm:text-sm text-primary-600 mb-4">Smart Civic Management Platform</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">Create Account</h2>
        </div>

        {/* Google Login Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-primary-200 rounded-xl hover:bg-accent-50 hover:border-accent-200 hover:text-accent-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-primary-700 font-medium">Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="text-center">
          <span className="text-sm text-primary-500">or use your email for registration</span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Name Field */}
          <div>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                  isFieldValid('name') ? 'focus:ring-accent-500' : 
                  isFieldInvalid('name') ? 'focus:ring-red-500' : 'focus:ring-accent-500'
                }`}
                placeholder="Full Name"
              />
              {isFieldValid('name') && (
                <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-500 w-5 h-5" />
              )}
              {isFieldInvalid('name') && (
                <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
              )}
            </div>
            {validationErrors.name && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                  isFieldValid('email') ? 'focus:ring-accent-500' : 
                  isFieldInvalid('email') ? 'focus:ring-red-500' : 'focus:ring-accent-500'
                }`}
                placeholder="Email"
              />
              {isFieldValid('email') && (
                <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-500 w-5 h-5" />
              )}
              {isFieldInvalid('email') && (
                <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
              )}
            </div>
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Phone Field (Optional) */}
          <div>
            <PhoneInput
              value={formData.phone}
              onChange={handleChange}
              error={validationErrors.phone}
              placeholder="9876543210"
            />
          </div>


          {/* Password Field */}
          <div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                  isFieldValid('password') ? 'focus:ring-accent-500' : 
                  isFieldInvalid('password') ? 'focus:ring-red-500' : 'focus:ring-accent-500'
                }`}
                placeholder="Password"
              />
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
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
            
            {/* Password Strength Indicator */}
            {formData.password && (
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
                placeholder="Confirm Password"
              />
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || Object.keys(validationErrors).length > 0 || passwordStrength.score < 3}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-accent-500 hover:to-accent-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center mt-4 sm:mt-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <InlineSpinner />
                <span className="ml-2">CREATING ACCOUNT...</span>
              </>
            ) : (
              'JOIN URBANEYE'
            )}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default RegisterPage;
