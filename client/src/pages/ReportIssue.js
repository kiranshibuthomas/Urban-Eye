import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMapPin, 
  FiCamera, 
  FiImage,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiArrowLeft,
  FiUpload,
  FiFileText,
  FiEye,
  FiEyeOff,
  FiShield
} from 'react-icons/fi';
import { isWithinGeofence } from '../services/geofenceService';
import CitizenHeader from '../components/CitizenHeader';

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { logout: sessionLogout } = useSession();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [geofenceMessage, setGeofenceMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    pincode: '',
    isAnonymous: false
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  
  const [predictedPriority, setPredictedPriority] = useState('medium');


  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Real-time validation
  useEffect(() => {
    validateField('title', formData.title);
  }, [formData.title]);

  useEffect(() => {
    validateField('description', formData.description);
  }, [formData.description]);

  useEffect(() => {
    validateField('address', formData.address);
  }, [formData.address]);

  useEffect(() => {
    validateField('city', formData.city);
  }, [formData.city]);

  useEffect(() => {
    validateField('pincode', formData.pincode);
  }, [formData.pincode]);

  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors };
    
    switch (fieldName) {
      case 'title':
        if (!value.trim()) {
          errors.title = 'Title is required';
        } else if (value.trim().length < 5) {
          errors.title = 'Title must be at least 5 characters long';
        } else if (value.trim().length > 100) {
          errors.title = 'Title cannot exceed 100 characters';
        } else {
          delete errors.title;
        }
        break;

      case 'description':
        if (!value.trim()) {
          errors.description = 'Description is required';
        } else if (value.trim().length < 20) {
          errors.description = 'Description must be at least 20 characters long';
        } else if (value.trim().length > 1000) {
          errors.description = 'Description cannot exceed 1000 characters';
        } else {
          delete errors.description;
        }
        break;

      case 'address':
        if (!value.trim()) {
          errors.address = 'Address is required';
        } else if (value.trim().length < 10) {
          errors.address = 'Address must be at least 10 characters long';
        } else if (value.trim().length > 200) {
          errors.address = 'Address cannot exceed 200 characters';
        } else {
          delete errors.address;
        }
        break;

      case 'city':
        if (!value.trim()) {
          errors.city = 'City is required';
        } else if (value.trim().length < 2) {
          errors.city = 'City must be at least 2 characters long';
        } else if (value.trim().length > 50) {
          errors.city = 'City cannot exceed 50 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.city = 'City can only contain letters and spaces';
        } else {
          delete errors.city;
        }
        break;

      case 'pincode':
        if (value && value.trim()) {
          const pincodeRegex = /^[1-9][0-9]{5}$/;
          if (!pincodeRegex.test(value.trim())) {
            errors.pincode = 'Please enter a valid 6-digit pincode';
          } else {
            delete errors.pincode;
          }
        } else {
          delete errors.pincode;
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
  };

  const isFieldValid = (fieldName) => {
    return !validationErrors[fieldName] && formData[fieldName] && formData[fieldName].trim();
  };

  const isFieldInvalid = (fieldName) => {
    return validationErrors[fieldName] && fieldTouched[fieldName];
  };

  const handleFieldBlur = (fieldName) => {
    setFieldTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };



  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationPermission('requesting');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Validate location with dynamic geofence configuration
        const geofenceCheck = await isWithinGeofence(latitude, longitude);
        
        if (!geofenceCheck.isInside) {
          setLocationPermission('denied');
          setIsLocationValid(false);
          setGeofenceMessage(geofenceCheck.message);
          setLocationError(geofenceCheck.message);
          toast.error('Location outside service area', {
            duration: 5000,
            icon: '🚫'
          });
          return;
        }
        
        // Location is valid
        setCurrentLocation({ latitude, longitude });
        setLocationPermission('granted');
        setIsLocationValid(true);
        setGeofenceMessage(geofenceCheck.message);
        setLocationError(null);
        
        // Reverse geocoding to get address
        reverseGeocode(latitude, longitude);
        
        toast.success(geofenceCheck.message || 'Location verified!', {
          duration: 3000,
          icon: '✅'
        });
      },
      (error) => {
        setLocationPermission('denied');
        setIsLocationValid(false);
        setLocationError('Unable to get your location. Please allow location access and try again.');
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Using a free geocoding service (you might want to use Google Maps API in production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.city && data.principalSubdivision) {
        setFormData(prev => ({
          ...prev,
          city: data.city || '',
          address: `${data.locality || ''}, ${data.principalSubdivision || ''}`.trim()
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image.`);
        return;
      }

      setImages(prev => [...prev, file]);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, {
          file,
          preview: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    // Mark all fields as touched
    const allFields = ['title', 'description', 'address', 'city'];
    allFields.forEach(field => {
      setFieldTouched(prev => ({ ...prev, [field]: true }));
    });

    // Create a temporary errors object to check validation
    const tempErrors = {};
    
    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      tempErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      tempErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.trim().length > 100) {
      tempErrors.title = 'Title cannot exceed 100 characters';
    }

    if (!formData.description || !formData.description.trim()) {
      tempErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      tempErrors.description = 'Description must be at least 20 characters long';
    } else if (formData.description.trim().length > 1000) {
      tempErrors.description = 'Description cannot exceed 1000 characters';
    }

    if (!formData.address || !formData.address.trim()) {
      tempErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      tempErrors.address = 'Address must be at least 10 characters long';
    }

    if (!formData.city || !formData.city.trim()) {
      tempErrors.city = 'City is required';
    } else if (formData.city.trim().length < 2) {
      tempErrors.city = 'City must be at least 2 characters long';
    }

    // Validate pincode only if provided
    if (formData.pincode && formData.pincode.trim()) {
      const pincodeRegex = /^[1-9][0-9]{5}$/;
      if (!pincodeRegex.test(formData.pincode.trim())) {
        tempErrors.pincode = 'Please enter a valid 6-digit pincode';
      }
    }

    // Update validation errors
    setValidationErrors(tempErrors);
    
    const hasErrors = Object.keys(tempErrors).length > 0;
    
    if (hasErrors) {
      toast.error('Please fix the validation errors before submitting');
      return false;
    }

    return true;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentLocation) {
      toast.error('Location is required. Please allow location access and ensure you are within the service area.');
      return;
    }

    if (!isLocationValid) {
      toast.error('You must be within the service area to submit a complaint.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Add form data (category and priority will be determined by AI)
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Add location
      submitData.append('latitude', currentLocation.latitude);
      submitData.append('longitude', currentLocation.longitude);

      // Add images
      images.forEach(image => {
        submitData.append('images', image);
      });

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: submitData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Show AI categorization and assignment result
        const aiInfo = data.aiAnalysis ? 
          `AI categorized as: ${data.aiAnalysis.category.replace('_', ' ')} (${data.aiAnalysis.priority} priority)` : '';
        
        const assignmentInfo = data.assignment ? 
          `Assigned to: ${data.assignment.fieldStaff} (${data.assignment.department})` : '';
        
        const fullMessage = `Issue reported successfully! ${aiInfo} ${assignmentInfo}`;
        
        toast.success(fullMessage, { duration: 6000 });
        navigate('/citizen-dashboard');
      } else {
        console.error('Submission failed:', data);
        toast.error(data.message || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Submit error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to report issue. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">
      <CitizenHeader />

      <div className="w-full px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Location Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-8"
          >
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center mr-4">
                <FiMapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Location Details</h2>
                <p className="text-gray-600">Help us locate the issue accurately</p>
              </div>
            </div>

            {locationPermission === 'requesting' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center text-emerald-600 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
              >
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mr-3"></div>
                <span className="font-medium">Getting your location...</span>
              </motion.div>
            )}

            {locationPermission === 'granted' && currentLocation && isLocationValid && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center text-emerald-600 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
              >
                <FiCheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">Location verified! ✓</p>
                  <p className="text-sm text-gray-600">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                  {geofenceMessage && (
                    <p className="text-xs text-emerald-700 mt-1">{geofenceMessage}</p>
                  )}
                </div>
              </motion.div>
            )}

            {!isLocationValid && geofenceMessage && locationPermission !== 'requesting' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start text-red-600 mb-6 p-4 bg-red-50 rounded-xl border border-red-200"
              >
                <FiAlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Location Outside Service Area</p>
                  <p className="text-sm text-red-700 mt-1">{geofenceMessage}</p>
                  <p className="text-xs text-red-600 mt-2">
                    This complaint reporting system is exclusively for residents within the configured service area. 
                    Please ensure you are physically within the boundaries to submit a complaint.
                  </p>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Retry Location Check
                  </button>
                </div>
              </motion.div>
            )}

            {locationPermission === 'denied' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center text-red-600 mb-6 p-4 bg-red-50 rounded-xl border border-red-200"
              >
                <FiAlertTriangle className="h-5 w-5 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">{locationError}</p>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="mt-2 text-emerald-600 hover:text-emerald-700 underline font-medium"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('address')}
                    required
                    className={`w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                      isFieldValid('address') ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' : 
                      isFieldInvalid('address') ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 
                      'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                    }`}
                    placeholder="Enter the address where the issue occurred"
                  />
                  {isFieldValid('address') && (
                    <FiCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  )}
                  {isFieldInvalid('address') && (
                    <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                  )}
                </div>
                {isFieldInvalid('address') && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  City *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('city')}
                    required
                    className={`w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                      isFieldValid('city') ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' : 
                      isFieldInvalid('city') ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 
                      'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                    }`}
                    placeholder="Enter city"
                  />
                  {isFieldValid('city') && (
                    <FiCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  )}
                  {isFieldInvalid('city') && (
                    <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                  )}
                </div>
                {isFieldInvalid('city') && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pincode
              </label>
              <div className="relative w-full md:w-1/3">
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('pincode')}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    isFieldValid('pincode') ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' : 
                    isFieldInvalid('pincode') ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 
                    'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                  }`}
                  placeholder="Enter pincode"
                  maxLength="6"
                />
                {isFieldValid('pincode') && (
                  <FiCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
                {isFieldInvalid('pincode') && (
                  <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                )}
              </div>
              {isFieldInvalid('pincode') && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.pincode}</p>
              )}
            </div>
          </motion.div>

          {/* Issue Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-8"
          >
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center mr-4">
                <FiFileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Issue Details</h2>
                <p className="text-gray-600">Provide detailed information about the issue</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('title')}
                    required
                    className={`w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                      isFieldValid('title') ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' : 
                      isFieldInvalid('title') ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 
                      'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                    }`}
                    placeholder="Brief description of the issue"
                    maxLength="100"
                  />
                  {isFieldValid('title') && (
                    <FiCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  )}
                  {isFieldInvalid('title') && (
                    <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                  )}
                </div>
                {isFieldInvalid('title') && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                )}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Minimum 5 characters</span>
                  <span>{formData.title.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description *
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('description')}
                    required
                    rows={4}
                    className={`w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                      isFieldValid('description') ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' : 
                      isFieldInvalid('description') ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 
                      'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                    }`}
                    placeholder="Detailed description of the issue..."
                    maxLength="1000"
                  />
                  {isFieldValid('description') && (
                    <FiCheckCircle className="absolute right-3 top-3 text-green-500 w-5 h-5" />
                  )}
                  {isFieldInvalid('description') && (
                    <FiX className="absolute right-3 top-3 text-red-500 w-5 h-5" />
                  )}
                </div>
                {isFieldInvalid('description') && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                )}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Minimum 20 characters</span>
                  <span>{formData.description.length}/1000</span>
                </div>
              </div>

              {/* AI-Powered Automation Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">🤖 AI-Powered Automation</h3>
                    <p className="text-gray-700 mb-3">
                      Our intelligent system will automatically:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span><strong>Analyze your description and images</strong> to determine the issue category</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span><strong>Set appropriate priority level</strong> based on urgency keywords</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span><strong>Instantly assign to qualified field staff</strong> with matching expertise</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span><strong>Start resolution process immediately</strong> without manual delays</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>⚡ Fast Track:</strong> Clear descriptions and quality photos help our AI categorize and assign your complaint instantly to the right team!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Image Upload */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-8"
          >
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center mr-4">
                <FiCamera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Photos</h2>
                <p className="text-gray-600">Upload photos to help describe the issue</p>
              </div>
            </div>
            
            <div className="mb-6 space-y-3">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-gray-700">
                  <strong>📸 For Better Review:</strong> Upload clear photos that show the issue from different angles. This helps our admin team understand and process your complaint more effectively.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-gray-600">
                  <strong>Guidelines:</strong> Maximum 5 images, 5MB each. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200"
              >
                <FiUpload className="h-6 w-6 mr-3" />
                <span className="font-semibold">Choose Photos</span>
              </motion.button>

              <AnimatePresence>
                {imagePreviews.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                  >
                    {imagePreviews.map((preview, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <img
                          src={preview.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                        >
                          <FiX className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Privacy Options */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-8"
          >
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center mr-4">
                <FiShield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Privacy Options</h2>
                <p className="text-gray-600">Choose how your report will be displayed</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="h-5 w-5 text-[#52796F] focus:ring-[#52796F] border-gray-300 rounded mt-0.5"
              />
              <div>
                <label htmlFor="isAnonymous" className="text-sm font-semibold text-gray-700 block cursor-pointer">
                  Submit anonymously {formData.isAnonymous ? '✓' : ''}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Your name will not be visible to other users or in public reports
                  {formData.isAnonymous && (
                    <span className="block text-emerald-600 font-medium mt-1">
                      ✓ Anonymous submission enabled
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>



          {/* Submit Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate('/citizen-dashboard')}
              className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !currentLocation || !isLocationValid || Object.keys(validationErrors).length > 0}
              className="px-8 py-3 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg"
            >
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              )}
              {loading ? 'Submitting Report...' : !isLocationValid && currentLocation ? 'Location Outside Service Area' : 'Submit Report'}
            </motion.button>
          </motion.div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
