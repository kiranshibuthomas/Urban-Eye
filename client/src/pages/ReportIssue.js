import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  FiShield
} from 'react-icons/fi';

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    address: '',
    city: '',
    pincode: '',
    isAnonymous: false
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Category options
  const categories = [
    { value: 'road_issues', label: 'Road Issues', icon: '🛣️' },
    { value: 'water_supply', label: 'Water Supply', icon: '💧' },
    { value: 'electricity', label: 'Electricity', icon: '⚡' },
    { value: 'waste_management', label: 'Waste Management', icon: '🗑️' },
    { value: 'public_transport', label: 'Public Transport', icon: '🚌' },
    { value: 'parks_recreation', label: 'Parks & Recreation', icon: '🌳' },
    { value: 'street_lighting', label: 'Street Lighting', icon: '💡' },
    { value: 'drainage', label: 'Drainage', icon: '🌊' },
    { value: 'noise_pollution', label: 'Noise Pollution', icon: '🔊' },
    { value: 'air_pollution', label: 'Air Pollution', icon: '🌫️' },
    { value: 'safety_security', label: 'Safety & Security', icon: '🛡️' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-emerald-600' },
    { value: 'medium', label: 'Medium', color: 'text-teal-600' },
    { value: 'high', label: 'High', color: 'text-green-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-lime-600' }
  ];

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationPermission('requesting');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setLocationPermission('granted');
        setLocationError(null);
        
        // Reverse geocoding to get address
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        setLocationPermission('denied');
        setLocationError('Unable to get your location. Please enter your address manually.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentLocation) {
      toast.error('Location is required. Please allow location access or enter coordinates manually.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Add form data
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
        toast.success('Issue reported successfully!');
        navigate('/citizen-dashboard');
      } else {
        toast.error(data.message || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-white/98 via-[#CAD2C5]/30 to-white/98 backdrop-blur-xl border-b border-[#84A98C]/50 sticky top-0 z-50 shadow-sm">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#84A98C] rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-[#52796F] rounded-full blur-2xl"></div>
        </div>
        <div className="relative w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-4">
            {/* Back Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/citizen-dashboard')}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200"
            >
              <FiArrowLeft className="h-6 w-6 text-[#52796F]" />
              <span className="text-[#52796F] font-medium">Back to Dashboard</span>
            </motion.button>

            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#2F3E46]">Report an Issue</h1>
              <p className="text-sm text-[#354F52]">Help improve your community</p>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center">
                <FiFileText className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-base font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">Citizen</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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

            {locationPermission === 'granted' && currentLocation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center text-emerald-600 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
              >
                <FiCheckCircle className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">Location detected successfully!</p>
                  <p className="text-sm text-gray-600">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
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
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                  placeholder="Enter the address where the issue occurred"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                  placeholder="Enter city"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full md:w-1/3 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                placeholder="Enter pincode"
              />
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
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200 resize-none"
                  placeholder="Detailed description of the issue..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
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
            
            <p className="text-gray-600 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <strong>Guidelines:</strong> Maximum 5 images, 5MB each. Supported formats: JPG, PNG, GIF
            </p>

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
                <label htmlFor="isAnonymous" className="text-sm font-semibold text-gray-700 block">
                  Submit anonymously
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Your name will not be visible to other users or in public reports
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
              disabled={loading || !currentLocation}
              className="px-8 py-3 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg"
            >
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              )}
              {loading ? 'Submitting Report...' : 'Submit Report'}
            </motion.button>
          </motion.div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
