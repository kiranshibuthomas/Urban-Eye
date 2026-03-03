import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin,
  FiNavigation,
  FiClock,
  FiPlay,
  FiPause,
  FiSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiX,
  FiCamera,
  FiFileText,
  FiActivity,
  FiTarget,
  FiInfo,
  FiEdit3,
  FiSave,
  FiUpload,
  FiEye,
  FiCalendar,
  FiUser,
  FiMessageSquare,
  FiShield,
  FiZap,
  FiTrendingUp,
  FiMap,
  FiWifi,
  FiWifiOff,
  FiExternalLink,
  FiDownload,
  FiImage,
  FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  calculateDistance, 
  formatDistance, 
  formatDuration, 
  getCurrentPosition, 
  openInMaps,
  checkLocationAccuracy 
} from '../utils/locationUtils';

const EnhancedFieldStaffWorkflow = ({ complaint, onStatusUpdate, onWorkComplete, onClose }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [workTimer, setWorkTimer] = useState(0);
  const [checkInTime, setCheckInTime] = useState(null);
  const [pauseReason, setPauseReason] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofImages, setProofImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [workLogs, setWorkLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('location');
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showWorkHistory, setShowWorkHistory] = useState(false);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current location using utility
  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    
    try {
      const location = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      });
      
      setCurrentLocation(location);
      setLocationAccuracy(location.accuracy);
      setIsLoadingLocation(false);
      
      // Validate location immediately after getting it
      if (locationStatus) {
        validateLocationDistance(location);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      toast.error(error.message);
      setIsLoadingLocation(false);
    }
  }, [locationStatus]);

  // Validate location distance using utility
  const validateLocationDistance = (location) => {
    if (!location || !locationStatus) return false;
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      locationStatus.complaintLocation.coordinates[1],
      locationStatus.complaintLocation.coordinates[0]
    );
    
    return distance <= locationStatus.allowedRadius;
  };

  // Fetch location status
  const fetchLocationStatus = useCallback(async () => {
    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    try {
      const response = await fetch(`/api/field-staff/complaints/${complaint._id}/location-status`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLocationStatus(data.locationStatus);
          setIsCheckedIn(data.locationStatus.isCheckedIn);
          setIsPaused(data.locationStatus.isPaused);
          setCheckInTime(data.locationStatus.checkInTime);
          setPauseReason(data.locationStatus.pauseReason || '');
        }
      } else {
        throw new Error('Failed to fetch location status');
      }
    } catch (error) {
      console.error('Failed to fetch location status:', error);
      toast.error('Failed to load location status');
    }
  }, [complaint._id, isOnline]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Check if current location is within allowed radius
  const isLocationValid = () => {
    if (!currentLocation || !locationStatus) return false;
    return validateLocationDistance(currentLocation);
  };

  // Get location validation status with detailed info
  const getLocationValidationInfo = () => {
    if (!currentLocation || !locationStatus) {
      return {
        isValid: false,
        distance: null,
        message: 'Getting location...',
        color: 'text-gray-500'
      };
    }
    
    const distance = Math.round(calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      locationStatus.complaintLocation.coordinates[1],
      locationStatus.complaintLocation.coordinates[0]
    ));
    
    const isValid = distance <= locationStatus.allowedRadius;
    
    return {
      isValid,
      distance,
      message: isValid 
        ? `✅ Within work area (${distance}m away)` 
        : `⚠️ ${distance}m from work area (allowed: ${locationStatus.allowedRadius}m)`,
      color: isValid ? 'text-green-600' : distance <= locationStatus.allowedRadius * 2 ? 'text-yellow-600' : 'text-red-600'
    };
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Handle check-in with enhanced validation
  const handleCheckIn = async () => {
    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    // Validate location accuracy using utility
    const accuracyCheck = checkLocationAccuracy(locationAccuracy, 100);
    if (!accuracyCheck.isAcceptable) {
      const proceed = window.confirm(
        `${accuracyCheck.message} This may affect check-in validation. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaint._id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          notes: checkInNotes.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsCheckedIn(true);
        setCheckInTime(new Date());
        toast.success(data.message);
        fetchLocationStatus();
        
        // Auto-start work if location is valid
        if (data.checkIn.isValidLocation && complaint.status === 'assigned') {
          setTimeout(() => {
            handleStartWork();
          }, 1000);
        }
      } else {
        toast.error(data.message || 'Failed to check in');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-out with validation
  const handleCheckOut = async () => {
    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    // Confirm check-out if work is in progress
    if (complaint.status === 'in_progress' && !isPaused) {
      const proceed = window.confirm(
        'You are currently working on this complaint. Checking out will pause your work. Do you want to continue?'
      );
      if (!proceed) return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaint._id}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          notes: checkInNotes.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setIsPaused(false);
        toast.success(data.message);
        fetchLocationStatus();
      } else {
        toast.error(data.message || 'Failed to check out');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle start work with validation
  const handleStartWork = async () => {
    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!isCheckedIn) {
      toast.error('Please check in at the location first');
      return;
    }

    const locationInfo = getLocationValidationInfo();
    if (!locationInfo.isValid) {
      const proceed = window.confirm(
        `You are ${locationInfo.distance}m away from the work area. Starting work from this distance may affect quality verification. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    setIsLoading(true);
    try {
      await onStatusUpdate(complaint._id, 'in_progress', 'Started working on the complaint');
      toast.success('Work started successfully! 🚀');
    } catch (error) {
      console.error('Start work error:', error);
      toast.error(`Failed to start work: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pause task with enhanced validation
  const handlePauseTask = async () => {
    if (!pauseReason.trim()) {
      toast.error('Please provide a reason for pausing the task');
      return;
    }

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaint._id}/pause-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: pauseReason.trim(),
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsPaused(true);
        toast.success(data.message);
        fetchLocationStatus();
        setPauseReason('');
      } else {
        toast.error(data.message || 'Failed to pause task');
      }
    } catch (error) {
      console.error('Pause task error:', error);
      toast.error('Failed to pause task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resume task with validation
  const handleResumeTask = async () => {
    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    const locationInfo = getLocationValidationInfo();
    if (!locationInfo.isValid) {
      const proceed = window.confirm(
        `You are ${locationInfo.distance}m away from the work area. Resuming work from this distance may affect quality verification. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaint._id}/resume-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsPaused(false);
        toast.success(data.message);
        fetchLocationStatus();
      } else {
        toast.error(data.message || 'Failed to resume task');
      }
    } catch (error) {
      console.error('Resume task error:', error);
      toast.error('Failed to resume task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update progress with validation
  const handleUpdateProgress = async () => {
    if (!progressNotes.trim()) {
      toast.error('Please provide progress notes');
      return;
    }

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!isCheckedIn) {
      toast.error('Please check in at the location first');
      return;
    }

    setIsLoading(true);
    try {
      await onStatusUpdate(complaint._id, 'in_progress', progressNotes);
      toast.success('Progress updated successfully! 📝');
      setProgressNotes('');
    } catch (error) {
      console.error('Progress update error:', error);
      toast.error(`Failed to update progress: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle complete work with enhanced validation
  const handleCompleteWork = async () => {
    if (!completionNotes.trim()) {
      toast.error('Please provide completion notes');
      return;
    }

    if (proofImages.length === 0) {
      toast.error('Proof images are mandatory for work completion');
      return;
    }

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!isCheckedIn) {
      toast.error('Please check in at the location first');
      return;
    }

    const locationInfo = getLocationValidationInfo();
    if (!locationInfo.isValid) {
      const proceed = window.confirm(
        `You are ${locationInfo.distance}m away from the work area. Completing work from this distance may affect quality verification. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    // Validate proof images
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    for (const image of proofImages) {
      if (!validTypes.includes(image.type)) {
        toast.error(`Invalid file type: ${image.name}. Only JPEG, PNG, and WebP images are allowed.`);
        return;
      }
      if (image.size > maxFileSize) {
        toast.error(`File too large: ${image.name}. Maximum size is 10MB.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      await onWorkComplete(complaint._id, completionNotes, proofImages);
      toast.success('Work completed successfully! Awaiting admin approval. ✅');
    } catch (error) {
      console.error('Complete work error:', error);
      toast.error(`Failed to complete work: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload with validation
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (proofImages.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }
    
    const validFiles = [];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP images are allowed.`);
        continue;
      }
      if (file.size > maxFileSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setProofImages(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} image(s) added successfully`);
    }
  };

  // Remove image with confirmation
  const removeImage = (index) => {
    const image = proofImages[index];
    const proceed = window.confirm(`Remove ${image.name}?`);
    if (proceed) {
      setProofImages(prev => prev.filter((_, i) => i !== index));
      toast.success('Image removed');
    }
  };

  // Open location in maps using utility
  const handleOpenInMaps = () => {
    if (!locationStatus?.complaintLocation) return;
    
    const [lng, lat] = locationStatus.complaintLocation.coordinates;
    openInMaps(lat, lng, 'Complaint Location');
  };

  // Get formatted file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration using utility
  const formatWorkDuration = (ms) => {
    return formatDuration(ms);
  };

  // Work timer effect
  useEffect(() => {
    let interval;
    if (isCheckedIn && !isPaused && checkInTime) {
      interval = setInterval(() => {
        setWorkTimer(Date.now() - new Date(checkInTime).getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, isPaused, checkInTime]);

  // Initialize component
  useEffect(() => {
    getCurrentLocation();
    fetchLocationStatus();
    
    // Set up periodic location updates every 2 minutes
    const locationInterval = setInterval(() => {
      if (isOnline && isCheckedIn) {
        getCurrentLocation();
      }
    }, 120000);
    
    return () => clearInterval(locationInterval);
  }, [getCurrentLocation, fetchLocationStatus, isOnline, isCheckedIn]);

  const locationInfo = getLocationValidationInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Field Work Management</h2>
                  <p className="text-gray-600 mt-1">{complaint.title}</p>
                </div>
                
                {/* Network Status */}
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <FiWifi className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      <FiWifiOff className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Offline</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'location', label: 'Location & Check-in', icon: FiMapPin },
              { id: 'work', label: 'Work Management', icon: FiActivity },
              { id: 'progress', label: 'Progress & Completion', icon: FiTarget },
              { id: 'history', label: 'Work History', icon: FiClock }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TabIcon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'location' && (
              <LocationTab
                key="location"
                currentLocation={currentLocation}
                locationInfo={locationInfo}
                locationStatus={locationStatus}
                isLoadingLocation={isLoadingLocation}
                isCheckedIn={isCheckedIn}
                checkInTime={checkInTime}
                checkInNotes={checkInNotes}
                setCheckInNotes={setCheckInNotes}
                isLoading={isLoading}
                onGetLocation={getCurrentLocation}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onOpenMaps={handleOpenInMaps}
                locationAccuracy={locationAccuracy}
              />
            )}
            
            {activeTab === 'work' && (
              <WorkTab
                key="work"
                complaint={complaint}
                isCheckedIn={isCheckedIn}
                isPaused={isPaused}
                pauseReason={pauseReason}
                setPauseReason={setPauseReason}
                workTimer={workTimer}
                isLoading={isLoading}
                onStartWork={handleStartWork}
                onPauseTask={handlePauseTask}
                onResumeTask={handleResumeTask}
                locationInfo={locationInfo}
              />
            )}
            
            {activeTab === 'progress' && (
              <ProgressTab
                key="progress"
                complaint={complaint}
                isCheckedIn={isCheckedIn}
                isPaused={isPaused}
                progressNotes={progressNotes}
                setProgressNotes={setProgressNotes}
                completionNotes={completionNotes}
                setCompletionNotes={setCompletionNotes}
                proofImages={proofImages}
                isLoading={isLoading}
                onUpdateProgress={handleUpdateProgress}
                onCompleteWork={handleCompleteWork}
                onImageUpload={handleImageUpload}
                onRemoveImage={removeImage}
                formatFileSize={formatFileSize}
              />
            )}
            
            {activeTab === 'history' && (
              <HistoryTab
                key="history"
                locationStatus={locationStatus}
                complaint={complaint}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

// Location Tab Component
const LocationTab = ({
  currentLocation,
  locationInfo,
  locationStatus,
  isLoadingLocation,
  isCheckedIn,
  checkInTime,
  checkInNotes,
  setCheckInNotes,
  isLoading,
  onGetLocation,
  onCheckIn,
  onCheckOut,
  onOpenMaps,
  locationAccuracy
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-6"
  >
    {/* Location Status Card */}
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FiMapPin className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-blue-900">Location Verification</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onGetLocation}
            disabled={isLoadingLocation}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {isLoadingLocation ? (
              <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FiNavigation className="h-4 w-4 mr-2" />
            )}
            {isLoadingLocation ? 'Getting Location...' : 'Update Location'}
          </button>
          {locationStatus && (
            <button
              onClick={onOpenMaps}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <FiExternalLink className="h-4 w-4 mr-2" />
              Open Maps
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">Current Status</p>
          <p className={`font-medium ${locationInfo.color}`}>
            {locationInfo.message}
          </p>
          {currentLocation && locationAccuracy && (
            <p className="text-xs text-gray-500 mt-1">
              Accuracy: ±{Math.round(locationAccuracy)}m
            </p>
          )}
          {currentLocation && (
            <p className="text-xs text-gray-500 mt-1">
              Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">Work Area Requirements</p>
          <p className="font-medium text-gray-900">
            {locationStatus?.allowedRadius || 150}m radius required
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Location verification ensures work quality and prevents fraud
          </p>
        </div>
      </div>
    </div>

    {/* Check-In/Check-Out Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {!isCheckedIn ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 md:col-span-2"
        >
          <div className="flex items-center mb-4">
            <FiMapPin className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">Check In at Location</h3>
          </div>
          <p className="text-blue-700 mb-4">
            Verify your location and check in to start working on this complaint. You must be within {locationStatus?.allowedRadius || 150}m of the complaint location.
          </p>
          
          {!locationInfo.isValid && locationInfo.distance && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  You are {locationInfo.distance}m away from the work area. Please move closer to the complaint location.
                </p>
              </div>
            </div>
          )}
          
          <textarea
            value={checkInNotes}
            onChange={(e) => setCheckInNotes(e.target.value)}
            placeholder="Optional check-in notes (e.g., observations, initial assessment)..."
            className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
            rows={3}
          />
          <button
            onClick={onCheckIn}
            disabled={isLoading || !currentLocation}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking In...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiMapPin className="h-4 w-4 mr-2" />
                Check In at Location
              </div>
            )}
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 md:col-span-2"
        >
          <div className="flex items-center mb-4">
            <FiCheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-green-900">Successfully Checked In</h3>
          </div>
          <p className="text-green-700 mb-4">
            You are checked in at the complaint location and can now start working.
          </p>
          <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-800">
                  <strong>Check-in Time:</strong> {new Date(checkInTime).toLocaleString()}
                </p>
                <p className="text-sm text-green-800 mt-1">
                  <strong>Location Status:</strong> {locationInfo.message}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-800">
                  <strong>Work Duration:</strong> {Math.round((new Date() - new Date(checkInTime)) / (1000 * 60))} minutes
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onCheckOut}
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking Out...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiSquare className="h-4 w-4 mr-2" />
                Check Out from Location
              </div>
            )}
          </button>
        </motion.div>
      )}
    </div>
  </motion.div>
);

// Work Tab Component
const WorkTab = ({
  complaint,
  isCheckedIn,
  isPaused,
  pauseReason,
  setPauseReason,
  workTimer,
  isLoading,
  onStartWork,
  onPauseTask,
  onResumeTask,
  locationInfo
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-6"
  >
    {/* Work Timer */}
    {isCheckedIn && (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiClock className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                {isPaused ? 'Work Paused' : 'Work in Progress'}
              </h3>
              <p className="text-green-700 text-sm">
                {isPaused ? 'Task is currently paused' : 'Actively working on complaint'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-800 font-bold text-2xl">
              {formatWorkDuration(workTimer)}
            </div>
            <p className="text-green-600 text-sm">Total work time</p>
          </div>
        </div>
        {isPaused && pauseReason && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>Pause Reason:</strong> {pauseReason}
            </p>
          </div>
        )}
      </div>
    )}

    {/* Work Management Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Start Work Card */}
      {complaint.status === 'assigned' && isCheckedIn && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center mb-4">
            <FiPlay className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">Start Work</h3>
          </div>
          <p className="text-blue-700 mb-4">
            Begin working on this complaint. This will change the status to "In Progress".
          </p>
          
          {!locationInfo.isValid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  You are {locationInfo.distance}m from the work area. Consider moving closer for better verification.
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={onStartWork}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Starting Work...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiPlay className="h-4 w-4 mr-2" />
                Start Work
              </div>
            )}
          </button>
        </motion.div>
      )}

      {/* Pause/Resume Task Card */}
      {isCheckedIn && complaint.status === 'in_progress' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isPaused ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-6`}
        >
          <div className="flex items-center mb-4">
            {isPaused ? (
              <FiPlay className="h-6 w-6 text-yellow-600 mr-3" />
            ) : (
              <FiPause className="h-6 w-6 text-orange-600 mr-3" />
            )}
            <h3 className={`text-lg font-semibold ${isPaused ? 'text-yellow-900' : 'text-orange-900'}`}>
              {isPaused ? 'Resume Task' : 'Pause Task'}
            </h3>
          </div>
          
          {!isPaused ? (
            <>
              <p className="text-orange-700 mb-4">
                Temporarily pause your work if needed (weather issues, resource unavailability, emergency, etc.).
              </p>
              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Reason for pausing (required)..."
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
                rows={3}
              />
              <button
                onClick={onPauseTask}
                disabled={isLoading || !pauseReason.trim()}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Pausing Task...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FiPause className="h-4 w-4 mr-2" />
                    Pause Task
                  </div>
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-yellow-700 mb-4">
                Resume your work when ready to continue. Make sure you're still at the correct location.
              </p>
              
              {!locationInfo.isValid && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <FiAlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-800 text-sm">
                      You are {locationInfo.distance}m from the work area. Please return to the complaint location.
                    </p>
                  </div>
                </div>
              )}
              
              <button
                onClick={onResumeTask}
                disabled={isLoading}
                className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resuming Task...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FiPlay className="h-4 w-4 mr-2" />
                    Resume Task
                  </div>
                )}
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>

    {/* Work Guidelines */}
    <div className="mt-6 bg-gray-50 rounded-xl p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FiInfo className="h-5 w-5 mr-2" />
        Work Guidelines
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-2">Location Requirements</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Must be within 150m of complaint location</li>
            <li>• Check-in required before starting work</li>
            <li>• Location verified every 2 minutes during work</li>
          </ul>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-2">Work Process</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check in → Start work → Update progress → Complete</li>
            <li>• Pause work if needed with valid reason</li>
            <li>• Proof images required for completion</li>
          </ul>
        </div>
      </div>
    </div>
  </motion.div>
);

// Progress Tab Component
const ProgressTab = ({
  complaint,
  isCheckedIn,
  isPaused,
  progressNotes,
  setProgressNotes,
  completionNotes,
  setCompletionNotes,
  proofImages,
  isLoading,
  onUpdateProgress,
  onCompleteWork,
  onImageUpload,
  onRemoveImage,
  formatFileSize
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-6"
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Update Progress Card */}
      {complaint.status === 'in_progress' && isCheckedIn && !isPaused && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded-xl p-6"
        >
          <div className="flex items-center mb-4">
            <FiActivity className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-purple-900">Update Progress</h3>
          </div>
          <p className="text-purple-700 mb-4">
            Keep stakeholders informed about your progress on this complaint.
          </p>
          <textarea
            value={progressNotes}
            onChange={(e) => setProgressNotes(e.target.value)}
            placeholder="Describe the progress made (e.g., materials gathered, work started, obstacles encountered)..."
            className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
            rows={4}
          />
          <button
            onClick={onUpdateProgress}
            disabled={isLoading || !progressNotes.trim()}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating Progress...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiEdit3 className="h-4 w-4 mr-2" />
                Update Progress
              </div>
            )}
          </button>
        </motion.div>
      )}

      {/* Complete Work Card */}
      {complaint.status === 'in_progress' && isCheckedIn && !isPaused && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6"
        >
          <div className="flex items-center mb-4">
            <FiTarget className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-green-900">Complete Work</h3>
          </div>
          <p className="text-green-700 mb-4">
            Mark this complaint as completed with proof images and detailed notes.
          </p>
          
          <textarea
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Describe what work was completed, materials used, final status..."
            className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
            rows={4}
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-green-700 mb-2">
              Proof Images * (Required - Max 5 images, 10MB each)
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={onImageUpload}
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm mb-2"
            />
            <p className="text-xs text-green-600">
              Upload clear images showing the completed work. Accepted formats: JPEG, PNG, WebP
            </p>
            
            {proofImages.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-green-700">
                  Selected Images ({proofImages.length}/5):
                </p>
                {proofImages.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-100 rounded-lg px-3 py-2">
                    <div className="flex items-center">
                      <FiImage className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <span className="text-sm text-green-700 font-medium">{file.name}</span>
                        <span className="text-xs text-green-600 ml-2">({formatFileSize(file.size)})</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveImage(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove image"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onCompleteWork}
            disabled={isLoading || !completionNotes.trim() || proofImages.length === 0}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Completing Work...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiCheckCircle className="h-4 w-4 mr-2" />
                Complete Work
              </div>
            )}
          </button>
        </motion.div>
      )}
    </div>

    {/* Work Status Info */}
    {(!isCheckedIn || isPaused || complaint.status !== 'in_progress') && (
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center mb-3">
          <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <h4 className="text-lg font-semibold text-yellow-900">Action Required</h4>
        </div>
        <div className="space-y-2 text-yellow-800">
          {!isCheckedIn && (
            <p>• Please check in at the complaint location first</p>
          )}
          {isPaused && (
            <p>• Work is currently paused - resume to continue progress updates</p>
          )}
          {complaint.status !== 'in_progress' && (
            <p>• Work must be started before progress can be updated</p>
          )}
        </div>
      </div>
    )}
  </motion.div>
);

// History Tab Component
const HistoryTab = ({ locationStatus, complaint }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-6"
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Check-in History */}
      {locationStatus?.recentCheckIns?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <FiMapPin className="h-5 w-5 mr-2" />
            Check-in History
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {locationStatus.recentCheckIns.map((checkIn, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FiClock className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      {new Date(checkIn.checkInTime).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    checkIn.isValidLocation 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {checkIn.isValidLocation ? 'Valid Location' : `${Math.round(checkIn.distanceFromComplaint)}m away`}
                  </span>
                </div>
                {checkIn.checkOutTime && (
                  <p className="text-xs text-gray-600 mb-1">
                    Checked out: {new Date(checkIn.checkOutTime).toLocaleString()}
                  </p>
                )}
                {checkIn.notes && (
                  <p className="text-xs text-gray-700 bg-gray-50 rounded p-2 mt-2">
                    {checkIn.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pause History */}
      {locationStatus?.recentPauses?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            <FiPause className="h-5 w-5 mr-2" />
            Pause History
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {locationStatus.recentPauses.map((pause, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-yellow-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FiClock className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-yellow-900">
                      {new Date(pause.pausedAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pause.resumedAt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {pause.resumedAt ? 'Resumed' : 'Active'}
                  </span>
                </div>
                {pause.resumedAt && (
                  <p className="text-xs text-gray-600 mb-1">
                    Resumed: {new Date(pause.resumedAt).toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-700 bg-gray-50 rounded p-2">
                  <strong>Reason:</strong> {pause.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Work Summary */}
    <div className="mt-6 bg-gray-50 rounded-xl p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FiBarChart3 className="h-5 w-5 mr-2" />
        Work Summary
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {locationStatus?.totalCheckIns || 0}
          </div>
          <p className="text-sm text-gray-600">Total Check-ins</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {locationStatus?.totalPauses || 0}
          </div>
          <p className="text-sm text-gray-600">Total Pauses</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {complaint.currentTaskStatus || 'Not Started'}
          </div>
          <p className="text-sm text-gray-600">Current Status</p>
        </div>
      </div>
    </div>

    {/* Empty State */}
    {(!locationStatus?.recentCheckIns?.length && !locationStatus?.recentPauses?.length) && (
      <div className="text-center py-12">
        <FiClock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No work history yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Check in at the location to start building your work history
        </p>
      </div>
    )}
  </motion.div>
);

export default EnhancedFieldStaffWorkflow;