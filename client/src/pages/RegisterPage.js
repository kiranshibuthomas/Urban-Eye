import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiUserCheck, FiMapPin, FiUsers, FiShield, FiTrendingUp, FiCheck, FiX } from 'react-icons/fi';
import { FaCity, FaBuilding, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { InlineSpinner } from '../components/LoadingSpinner';
import PhoneInput from '../components/PhoneInput';
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
    if (passwordStrength.score <= 3) return 'text-yellow-500';
    if (passwordStrength.score <= 4) return 'text-blue-500';
    return 'text-green-500';
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
        const redirectPath = result.user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard';
        navigate(redirectPath, { replace: true });
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with city skyline pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
        {/* City skyline silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-800/20 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-2 px-4">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-600/30 rounded-t-sm"
                style={{
                  height: `${Math.random() * 70 + 30}px`,
                  width: `${Math.random() * 18 + 8}px`,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Floating smart city icons */}
        <div className="absolute inset-0">
          <FaBuilding className="absolute top-16 left-32 text-blue-200 w-7 h-7 animate-pulse" />
          <FiUsers className="absolute top-28 right-24 text-green-200 w-6 h-6 animate-bounce" />
          <FiShield className="absolute bottom-36 left-24 text-purple-200 w-6 h-6 animate-pulse" />
          <FaCity className="absolute top-36 right-1/3 text-indigo-200 w-8 h-8 animate-pulse" />
          <FiTrendingUp className="absolute bottom-28 right-16 text-emerald-200 w-7 h-7 animate-bounce" />
          <FaCog className="absolute top-24 left-1/2 text-pink-200 w-6 h-6 animate-spin" style={{ animationDuration: '12s' }} />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl mx-4 grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[700px]"
        >
          {/* Left Side - Smart City Themed Welcome Section */}
          <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden order-2 lg:order-1">
            {/* Background city pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-8 left-8">
                <FiUsers className="w-12 h-12" />
              </div>
              <div className="absolute top-16 right-12">
                <FiShield className="w-8 h-8" />
              </div>
              <div className="absolute bottom-16 left-12">
                <FaBuilding className="w-10 h-10" />
              </div>
              <div className="absolute bottom-8 right-8">
                <FiMapPin className="w-10 h-10" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FaCog className="w-20 h-20 animate-spin" style={{ animationDuration: '25s' }} />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-center text-white z-10 relative"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mb-6"
              >
                <FiUsers className="w-16 h-16 mx-auto mb-4 opacity-80" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
              >
                Welcome Back!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-sm sm:text-base lg:text-lg mb-2 opacity-90 leading-relaxed"
              >
                Already have an account with UrbanEye?
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="text-sm sm:text-base lg:text-lg mb-8 opacity-90 leading-relaxed"
              >
                Sign in to continue managing your city
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                <Link
                  to="/login"
                  className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-emerald-600 transition-all duration-300"
                >
                  SIGN IN
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center order-1 lg:order-2">
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
                  className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                >
                  <FaCity className="text-white w-8 h-8" />
                </motion.div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">UrbanEye</h1>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Smart Civic Management Platform</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              </div>

              {/* Google Login Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Continue with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="text-center">
                <span className="text-sm text-gray-500">or use your email for registration</span>
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
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                        isFieldValid('name') ? 'focus:ring-green-500' : 
                        isFieldInvalid('name') ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                      }`}
                      placeholder="Full Name"
                    />
                    {isFieldValid('name') && (
                      <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
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
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                        isFieldValid('email') ? 'focus:ring-green-500' : 
                        isFieldInvalid('email') ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                      }`}
                      placeholder="Email"
                    />
                    {isFieldValid('email') && (
                      <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
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

                {/* Role Selection */}
                <div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all duration-200"
                  >
                    <option value="citizen">👤 Citizen Account</option>
                    <option value="admin">🏛️ Admin Account</option>
                  </select>
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
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                        isFieldValid('password') ? 'focus:ring-green-500' : 
                        isFieldInvalid('password') ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                      }`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score <= 2 ? 'bg-red-500' :
                            passwordStrength.score <= 3 ? 'bg-yellow-500' :
                            passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        {passwordStrength.feedback.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <FiCheck className="w-3 h-3 text-green-500 mr-1" />
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
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 pr-10 ${
                        isFieldValid('confirmPassword') ? 'focus:ring-green-500' : 
                        isFieldInvalid('confirmPassword') ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                      }`}
                      placeholder="Confirm Password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    {isFieldValid('confirmPassword') && (
                      <FiCheck className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
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
                    className="bg-red-50 border border-red-200 rounded-md p-3"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || Object.keys(validationErrors).length > 0 || passwordStrength.score < 3}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-center mt-4 sm:mt-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
