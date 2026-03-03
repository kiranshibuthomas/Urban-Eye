import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMapPin, 
  FiCamera, 
  FiVideo,
  FiX,
  FiArrowLeft
} from 'react-icons/fi';
import { 
  MdAddRoad, 
  MdWater, 
  MdElectricalServices, 
  MdDeleteOutline, 
  MdConstruction, 
  MdMoreHoriz,
  MdWaterDrop
} from 'react-icons/md';
import { getApiURL } from '../utils/apiConfig';
import CitizenLayout from '../components/CitizenLayout';
import MapLocationPicker from '../components/MapLocationPicker';
import NearbyReportsDisplay from '../components/NearbyReportsDisplay';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('map'); // 'map', 'form'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    address: '',
    city: '',
    pincode: ''
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Media uploads
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Nearby reports state
  const [nearbyReports, setNearbyReports] = useState([]);
  const [loadingNearbyReports, setLoadingNearbyReports] = useState(false);
  const [showNearbyReportsModal, setShowNearbyReportsModal] = useState(false);

  // Issue categories aligned with field staff departments
  const issueCategories = [
    { id: 'public_works', label: 'Roads & Infrastructure', icon: MdAddRoad, color: '#EF4444' },
    { id: 'water_supply', label: 'Water Supply', icon: MdWater, color: '#3B82F6' },
    { id: 'sanitation', label: 'Waste & Sanitation', icon: MdDeleteOutline, color: '#10B981' },
    { id: 'electricity', label: 'Electrical & Lighting', icon: MdElectricalServices, color: '#F59E0B' }
  ];


  // Initialize with map selection
  useEffect(() => {
    setShowMapPicker(true);
  }, []);

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'category':
        if (!value) {
          newErrors.category = 'Please select an issue category';
        } else {
          delete newErrors.category;
        }
        break;

      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters long';
        } else if (value.trim().length > 1000) {
          newErrors.description = 'Description must not exceed 1000 characters';
        } else {
          delete newErrors.description;
        }
        break;

      case 'address':
        if (!value.trim()) {
          newErrors.address = 'Address is required';
        } else if (value.trim().length < 5) {
          newErrors.address = 'Please provide a more detailed address';
        } else {
          delete newErrors.address;
        }
        break;

      case 'city':
        if (!value.trim()) {
          newErrors.city = 'City is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.city = 'City name should only contain letters and spaces';
        } else {
          delete newErrors.city;
        }
        break;

      case 'pincode':
        if (!value.trim()) {
          newErrors.pincode = 'Pincode is required';
        } else if (!/^\d{6}$/.test(value.trim())) {
          newErrors.pincode = 'Pincode must be exactly 6 digits';
        } else {
          delete newErrors.pincode;
        }
        break;

      case 'issueType':
        if (!value) {
          newErrors.issueType = 'Please select an issue type';
        } else {
          delete newErrors.issueType;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate all fields
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Only validate the absolute essentials
    
    // 1. Location is selected
    if (!selectedLocation) {
      toast.error('Please select a location first');
      isValid = false;
    }

    // 2. Category is selected
    if (!formData.category) {
      toast.error('Please select an issue category');
      newErrors.category = 'Please select an issue category';
      isValid = false;
    }

    // 3. Description is provided
    if (!formData.description || formData.description.trim().length < 10) {
      toast.error('Please provide a description (at least 10 characters)');
      newErrors.description = 'Description must be at least 10 characters long';
      isValid = false;
    }

    // 4. At least one image is uploaded
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      isValid = false;
    }

    // Update errors state
    setErrors(newErrors);

    // Mark required fields as touched
    setTouched({
      category: true,
      description: true
    });

    return isValid;
  };

  // Handle location selection from map
  const handleMapLocationSelect = (locationData) => {
    setSelectedLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
    setIsLocationValid(locationData.isValid);
    
    // Auto-populate address fields with detailed information
    setFormData(prev => ({
      ...prev,
      address: locationData.address || '',
      city: locationData.city || prev.city,
      pincode: locationData.pincode || prev.pincode
    }));
    
    // Close map picker but don't go to form yet
    setShowMapPicker(false);
    toast.success('Location selected successfully!');
    
    // Fetch nearby reports and show popup
    fetchNearbyReports(locationData.latitude, locationData.longitude);
  };

  // Fetch nearby reports
  const fetchNearbyReports = async (latitude, longitude) => {
    setLoadingNearbyReports(true);
    setShowNearbyReportsModal(true); // Show modal when starting to fetch
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingNearbyReports(false);
        setShowNearbyReportsModal(false);
        // Go to form if no token
        setCurrentStep('form');
        return;
      }

      const response = await fetch(
        getApiURL(`complaints/nearby?latitude=${latitude}&longitude=${longitude}&radius=100`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setNearbyReports(data.complaints || []);
        // If no reports found, go directly to form
        if (!data.complaints || data.complaints.length === 0) {
          setShowNearbyReportsModal(false);
          setCurrentStep('form');
        }
        // If reports found, keep modal open for user decision
      } else {
        console.error('Failed to fetch nearby reports:', data.message);
        setShowNearbyReportsModal(false);
        setCurrentStep('form');
      }
    } catch (error) {
      console.error('Error fetching nearby reports:', error);
      setShowNearbyReportsModal(false);
      setCurrentStep('form');
      // Don't show error toast as it's not critical - user can still proceed
    } finally {
      setLoadingNearbyReports(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId
    }));
    
    // Clear category error when user selects
    if (errors.category) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.category;
        return newErrors;
      });
    }
    
    setTouched(prev => ({ ...prev, category: true }));
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field on change (debounced for better UX)
    setTimeout(() => {
      if (touched[name] || value.trim() !== '') {
        validateField(name, value);
      }
    }, 300);
  };

  // Handle field blur for immediate validation
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Handle image upload (max 3 images)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 3) {
      toast.error('Maximum 3 images allowed');
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

  // Handle video upload (max 1 video)
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit for video
      toast.error('Video file is too large. Maximum size is 50MB.');
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file.');
      return;
    }

    setVideo(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove video
  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  // Submit complaint directly
  const submitComplaint = async () => {
    try {
      setLoading(true);
      const submitData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (formData[key]) { // Only add non-empty values
          submitData.append(key, formData[key]);
        }
      });

      // Add location data
      if (selectedLocation) {
        submitData.append('latitude', selectedLocation.latitude);
        submitData.append('longitude', selectedLocation.longitude);
      }

      // Add user email for confirmation (if user is logged in)
      if (user && user.email) {
        submitData.append('userEmail', user.email);
        submitData.append('userName', user.name);
      }

      // Add images
      images.forEach(image => {
        submitData.append('images', image);
      });

      // Add video
      if (video) {
        submitData.append('video', video);
      }

      const response = await fetch(getApiURL('complaints'), {
        method: 'POST',
        body: submitData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Issue reported successfully! A confirmation email has been sent.', { duration: 6000 });
        navigate('/citizen-dashboard');
      } else {
        console.error('Submission failed:', data);
        toast.error(data.message || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate entire form
    const isFormValid = validateForm();
    
    if (!isFormValid) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Submit complaint directly
    await submitComplaint();
  };

  return (
    <CitizenLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">
        
        {/* Map Selection Step */}
        {currentStep === 'map' && (
          <AnimatePresence>
            <MapLocationPicker
              isOpen={showMapPicker}
              onClose={() => navigate('/citizen-dashboard')}
              onLocationSelect={handleMapLocationSelect}
              initialLocation={selectedLocation}
            />
          </AnimatePresence>
        )}

        {/* Form Step */}
        {currentStep === 'form' && (
          <div className="w-full min-h-screen px-4 lg:px-6 py-6">
            <div className="max-w-2xl mx-auto">
              
              {/* Header with back button */}
              <div className="flex items-center mb-6">
                <button
                  onClick={() => {
                    setCurrentStep('map');
                    setShowMapPicker(true);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 mr-3 flex-shrink-0"
                >
                  <FiArrowLeft className="h-6 w-6 text-gray-700" />
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Report an Issue</h1>
              </div>

              {/* Location Display with Map Preview */}
              {selectedLocation && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-[#84A98C]/30"
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <FiMapPin className="h-5 w-5 text-[#52796F] mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">Selected Location</h3>
                      <div className="space-y-2">
                        {/* Address Input */}
                        <div>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            onBlur={handleFieldBlur}
                            placeholder="Enter detailed address (optional)"
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 ${
                              errors.address && touched.address
                                ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                                : 'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                            }`}
                          />
                          {errors.address && touched.address && (
                            <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                          )}
                        </div>
                        
                        {/* City and Pincode Row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              onBlur={handleFieldBlur}
                              placeholder="City (optional)"
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 ${
                                errors.city && touched.city
                                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                                  : 'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                              }`}
                            />
                            {errors.city && touched.city && (
                              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                            )}
                          </div>
                          
                          <div>
                            <input
                              type="text"
                              name="pincode"
                              value={formData.pincode}
                              onChange={handleInputChange}
                              onBlur={handleFieldBlur}
                              placeholder="Pincode (optional)"
                              maxLength={6}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 ${
                                errors.pincode && touched.pincode
                                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                                  : 'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                              }`}
                            />
                            {errors.pincode && touched.pincode && (
                              <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep('map');
                        setShowMapPicker(true);
                      }}
                      className="text-sm text-[#52796F] hover:text-[#354F52] font-medium transition-colors duration-200"
                    >
                      Change
                    </button>
                  </div>

                  {/* Mini Map */}
                  <div className="h-48 rounded-xl overflow-hidden border border-gray-200 mb-4">
                    <MapContainer
                      center={[selectedLocation.latitude, selectedLocation.longitude]}
                      zoom={16}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      dragging={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {/* Selected location marker */}
                      <Marker position={[selectedLocation.latitude, selectedLocation.longitude]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">Your Selected Location</p>
                            <p className="text-sm text-gray-600">{formData.address}</p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* 100m radius circle */}
                      <Circle
                        center={[selectedLocation.latitude, selectedLocation.longitude]}
                        radius={100}
                        pathOptions={{
                          color: '#52796F',
                          fillColor: '#52796F',
                          fillOpacity: 0.1,
                          weight: 2
                        }}
                      />

                      {/* Nearby reports markers */}
                      {nearbyReports.map((report) => (
                        <Marker
                          key={report._id}
                          position={[report.location.coordinates[1], report.location.coordinates[0]]}
                        >
                          <Popup>
                            <div className="min-w-[200px]">
                              <p className="font-semibold text-sm">{report.title || `${report.category} Issue`}</p>
                              <p className="text-xs text-gray-600 mb-1">{report.description.substring(0, 100)}...</p>
                              <p className="text-xs text-gray-500">Distance: {report.distance}m</p>
                              <p className="text-xs text-gray-500">Status: {report.status}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" id="report-form-section">
                
                {/* Image Upload Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border ${
                    images.length === 0 && Object.keys(touched).length > 0
                      ? 'border-red-300 error-field'
                      : 'border-[#84A98C]/30'
                  }`}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    Upload Images* (Maximum 3 images)
                    {images.length === 0 && Object.keys(touched).length > 0 && (
                      <span className="text-red-500 text-sm font-normal ml-2">
                        At least one image is required
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload clear photos of the issue. Maximum file size: 5MB per image.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="aspect-square">
                        {imagePreviews[index] ? (
                          <div className="relative group">
                            <img
                              src={imagePreviews[index].preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover rounded-xl border-2 border-dashed border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <FiX className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-[#52796F] transition-colors duration-200 ${
                              images.length === 0 && Object.keys(touched).length > 0
                                ? 'border-red-300 hover:border-red-400'
                                : 'border-gray-300 hover:border-[#52796F]'
                            }`}
                          >
                            <FiCamera className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                            <span className="text-xs text-center">Add Image</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {images.length > 0 && (
                    <div className="text-sm text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {images.length} image{images.length > 1 ? 's' : ''} uploaded
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </motion.div>

                {/* Video Upload Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#84A98C]/30"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    Upload Video (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a video to provide additional context. Maximum file size: 50MB.
                  </p>
                  
                  <div className="aspect-video">
                    {videoPreview ? (
                      <div className="relative group">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-full object-cover rounded-xl border-2 border-dashed border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <FiX className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-[#52796F] hover:text-[#52796F] transition-colors duration-200"
                      >
                        <FiVideo className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-3" />
                        <span className="text-sm">Add Video (Optional)</span>
                        <span className="text-xs text-gray-400 mt-1">Max 50MB</span>
                      </button>
                    )}
                  </div>

                  {video && (
                    <div className="text-sm text-green-600 flex items-center mt-3">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Video uploaded: {video.name}
                    </div>
                  )}

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </motion.div>

                {/* Issue Category Selection */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border ${
                    errors.category && touched.category 
                      ? 'border-red-300 error-field' 
                      : 'border-[#84A98C]/30'
                  }`}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Issue with*
                    {errors.category && touched.category && (
                      <span className="text-red-500 text-sm font-normal ml-2">
                        {errors.category}
                      </span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                    {issueCategories.map((category) => {
                      const IconComponent = category.icon;
                      const isSelected = formData.category === category.id;
                      
                      return (
                        <motion.button
                          key={category.id}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCategorySelect(category.id)}
                          className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 sm:p-4 transition-all duration-200 ${
                            isSelected 
                              ? 'border-[#52796F] bg-[#52796F]/10 text-[#52796F]' 
                              : errors.category && touched.category
                                ? 'border-red-300 hover:border-red-400 text-gray-600'
                                : 'border-gray-300 hover:border-gray-400 text-gray-600'
                          }`}
                        >
                          <IconComponent 
                            className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" 
                            style={{ color: isSelected ? '#52796F' : category.color }}
                          />
                          <span className="text-xs sm:text-sm font-medium text-center">{category.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border ${
                    errors.description && touched.description 
                      ? 'border-red-300 error-field' 
                      : 'border-[#84A98C]/30'
                  }`}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description*
                    {errors.description && touched.description && (
                      <span className="text-red-500 text-sm font-normal ml-2">
                        {errors.description}
                      </span>
                    )}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    required
                    rows={4}
                    maxLength={1000}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 resize-none transition-colors duration-200 ${
                      errors.description && touched.description
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#52796F]/20 focus:border-[#52796F]'
                    }`}
                    placeholder="Describe the issue in detail... (minimum 10 characters)"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      Minimum 10 characters required
                    </div>
                    <div className={`text-xs ${
                      formData.description.length > 900 
                        ? 'text-red-500' 
                        : formData.description.length > 800 
                          ? 'text-yellow-600' 
                          : 'text-gray-500'
                    }`}>
                      {formData.description.length}/1000
                    </div>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                    loading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#52796F] to-[#354F52] text-white hover:shadow-lg cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting Report...
                    </div>
                  ) : (
                    'SUBMIT REPORT'
                  )}
                </motion.button>



                {/* Validation Summary */}
                {Object.keys(errors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4"
                  >
                    <h4 className="text-red-800 font-semibold text-sm mb-2">Please fix the following errors:</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field} className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Global Nearby Reports Popup */}
        <NearbyReportsDisplay
          reports={nearbyReports}
          loading={loadingNearbyReports}
          isOpen={showNearbyReportsModal}
          onClose={() => {
            setShowNearbyReportsModal(false);
            setCurrentStep('form');
          }}
          onChangeLocation={() => {
            setShowNearbyReportsModal(false);
            setCurrentStep('map');
            setShowMapPicker(true);
          }}
          onProceedWithReport={() => {
            setShowNearbyReportsModal(false);
            setCurrentStep('form');
          }}
        />
      </div>
    </CitizenLayout>
  );
};

export default ReportIssue;
