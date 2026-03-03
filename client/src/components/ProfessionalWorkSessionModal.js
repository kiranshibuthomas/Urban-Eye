import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiMapPin,
  FiNavigation,
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
  FiActivity,
  FiTarget,
  FiSend,
  FiImage,
  FiTrash2,
  FiExternalLink,
  FiUpload,
  FiCheck,
  FiAlertTriangle,
  FiInfo,
  FiCamera
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCurrentPosition, calculateDistance, formatDuration } from '../utils/locationUtils';

const ProfessionalWorkSessionModal = ({ complaint, activeSession, onClose }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [workSession, setWorkSession] = useState(activeSession);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('location');
  const [workTimer, setWorkTimer] = useState(0);
  
  // Form states
  const [progressDescription, setProgressDescription] = useState('');
  const [progressImages, setProgressImages] = useState([]);
  const [pauseReason, setPauseReason] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImages, setCompletionImages] = useState([]);

  // Get current location
  const getCurrentLocationData = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentPosition();
      setCurrentLocation(location);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  // Calculate distance from complaint
  const getLocationValidation = useCallback(() => {
    if (!currentLocation || !complaint.location?.coordinates) {
      return { isValid: false, distance: null, message: 'Getting location...' };
    }

    const distance = Math.round(calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      complaint.location.coordinates[1],
      complaint.location.coordinates[0]
    ));

    const isValid = distance <= 150;
    
    return {
      isValid,
      distance,
      message: isValid 
        ? `Within work area (${distance}m away)` 
        : `${distance}m from work area (max: 150m)`
    };
  }, [currentLocation, complaint.location]);

  // Start work
  const handleStartWork = async () => {
    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    const validation = getLocationValidation();
    if (!validation.isValid) {
      toast.error(`You must be within 150m of the complaint location. You are ${validation.distance}m away.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/field-work/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          complaintId: complaint._id,
          location: currentLocation
        })
      });

      const data = await response.json();
      if (data.success) {
        setWorkSession(data.workLog);
        setActiveTab('work');
        toast.success('Work started successfully!');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add progress update
  const handleAddProgress = async () => {
    if (!progressDescription.trim()) {
      toast.error('Please provide a progress description');
      return;
    }

    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', workSession.sessionId);
      formData.append('description', progressDescription);
      formData.append('location', JSON.stringify(currentLocation));
      
      progressImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/field-work/progress', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setWorkSession(data.workLog);
        setProgressDescription('');
        setProgressImages([]);
        toast.success('Progress updated successfully!');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pause work
  const handlePauseWork = async () => {
    if (!pauseReason.trim()) {
      toast.error('Please provide a reason for pausing');
      return;
    }

    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/field-work/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: workSession.sessionId,
          reason: pauseReason,
          location: currentLocation
        })
      });

      const data = await response.json();
      if (data.success) {
        setWorkSession(data.workLog);
        setPauseReason('');
        toast.success('Work paused successfully');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resume work
  const handleResumeWork = async () => {
    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    const validation = getLocationValidation();
    if (!validation.isValid) {
      toast.error(`You must be within 150m of the complaint location to resume work. You are ${validation.distance}m away.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/field-work/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: workSession.sessionId,
          location: currentLocation
        })
      });

      const data = await response.json();
      if (data.success) {
        setWorkSession(data.workLog);
        toast.success('Work resumed successfully');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete work
  const handleCompleteWork = async () => {
    if (!completionNotes.trim()) {
      toast.error('Please provide completion notes');
      return;
    }

    if (completionImages.length === 0) {
      toast.error('Please upload at least one completion image');
      return;
    }

    if (!currentLocation) {
      toast.error('Please get your current location first');
      return;
    }

    const validation = getLocationValidation();
    if (!validation.isValid) {
      toast.error(`You must be within 150m of the complaint location to complete work. You are ${validation.distance}m away.`);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', workSession.sessionId);
      formData.append('completionNotes', completionNotes);
      formData.append('location', JSON.stringify(currentLocation));
      
      completionImages.forEach((image) => {
        formData.append('completionImages', image);
      });

      const response = await fetch('/api/field-work/complete', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setWorkSession(data.workLog);
        setActiveTab('submit');
        toast.success('Work completed successfully!');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit for review
  const handleSubmitForReview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/field-work/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: workSession.sessionId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Work submitted for admin review!');
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e, type) => {
    const files = Array.from(e.target.files);
    const maxFiles = type === 'progress' ? 3 : 5;
    const currentImages = type === 'progress' ? progressImages : completionImages;
    
    if (currentImages.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (type === 'progress') {
      setProgressImages(prev => [...prev, ...validFiles]);
    } else {
      setCompletionImages(prev => [...prev, ...validFiles]);
    }
  };

  // Remove image
  const removeImage = (index, type) => {
    if (type === 'progress') {
      setProgressImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setCompletionImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Work timer effect
  useEffect(() => {
    let interval;
    if (workSession && (workSession.status === 'started' || workSession.status === 'resumed')) {
      interval = setInterval(() => {
        const startTime = new Date(workSession.startTime);
        setWorkTimer(Date.now() - startTime.getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workSession]);

  // Initialize
  useEffect(() => {
    getCurrentLocationData();
  }, [getCurrentLocationData]);

  const locationValidation = getLocationValidation();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiActivity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Work Session</h2>
                <p className="text-blue-100 mt-1">{complaint.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Work Timer */}
          {workSession && (workSession.status === 'started' || workSession.status === 'resumed') && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">Work in Progress</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatDuration(workTimer)}
                </div>
              </div>
            </div>
          )}

          {/* Professional Tab Navigation */}
          <div className="flex space-x-1 mt-6 bg-white/10 p-1 rounded-xl">
            {[
              { id: 'location', label: 'Location', icon: FiMapPin },
              { id: 'work', label: 'Work', icon: FiActivity },
              { id: 'progress', label: 'Progress', icon: FiTarget },
              { id: 'complete', label: 'Complete', icon: FiCheckCircle },
              { id: 'submit', label: 'Submit', icon: FiSend }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isDisabled = 
                (tab.id === 'work' && !workSession) ||
                (tab.id === 'progress' && (!workSession || workSession.status === 'paused')) ||
                (tab.id === 'complete' && (!workSession || (workSession.status !== 'started' && workSession.status !== 'resumed'))) ||
                (tab.id === 'submit' && (!workSession || workSession.status !== 'completed'));

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-lg'
                      : isDisabled
                      ? 'text-white/40 cursor-not-allowed'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
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
              <ProfessionalLocationTab
                key="location"
                currentLocation={currentLocation}
                locationValidation={locationValidation}
                isLoadingLocation={isLoadingLocation}
                onGetLocation={getCurrentLocationData}
                onStartWork={handleStartWork}
                isLoading={isLoading}
                workSession={workSession}
                complaint={complaint}
              />
            )}

            {activeTab === 'work' && (
              <ProfessionalWorkTab
                key="work"
                workSession={workSession}
                pauseReason={pauseReason}
                setPauseReason={setPauseReason}
                onPause={handlePauseWork}
                onResume={handleResumeWork}
                isLoading={isLoading}
                locationValidation={locationValidation}
              />
            )}

            {activeTab === 'progress' && (
              <ProfessionalProgressTab
                key="progress"
                progressDescription={progressDescription}
                setProgressDescription={setProgressDescription}
                progressImages={progressImages}
                onImageUpload={(e) => handleImageUpload(e, 'progress')}
                onRemoveImage={(index) => removeImage(index, 'progress')}
                onAddProgress={handleAddProgress}
                isLoading={isLoading}
                workSession={workSession}
              />
            )}

            {activeTab === 'complete' && (
              <ProfessionalCompleteTab
                key="complete"
                completionNotes={completionNotes}
                setCompletionNotes={setCompletionNotes}
                completionImages={completionImages}
                onImageUpload={(e) => handleImageUpload(e, 'completion')}
                onRemoveImage={(index) => removeImage(index, 'completion')}
                onComplete={handleCompleteWork}
                isLoading={isLoading}
                locationValidation={locationValidation}
              />
            )}

            {activeTab === 'submit' && (
              <ProfessionalSubmitTab
                key="submit"
                workSession={workSession}
                onSubmit={handleSubmitForReview}
                isLoading={isLoading}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

// Professional Location Tab Component
const ProfessionalLocationTab = ({ 
  currentLocation, 
  locationValidation, 
  isLoadingLocation, 
  onGetLocation, 
  onStartWork, 
  isLoading, 
  workSession,
  complaint 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="space-y-8">
      {/* Location Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-blue-900 flex items-center">
            <FiMapPin className="h-6 w-6 mr-3" />
            Location Verification
          </h3>
          <button
            onClick={onGetLocation}
            disabled={isLoadingLocation}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg"
          >
            {isLoadingLocation ? (
              <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FiNavigation className="h-4 w-4 mr-2" />
            )}
            {isLoadingLocation ? 'Getting Location...' : 'Update Location'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              {locationValidation.isValid ? (
                <FiCheck className="h-6 w-6 text-green-600" />
              ) : (
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              )}
              <h4 className="font-semibold text-gray-900">Current Status</h4>
            </div>
            <p className={`font-medium text-lg ${
              locationValidation.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {locationValidation.message}
            </p>
            {currentLocation && (
              <p className="text-sm text-gray-500 mt-2">
                GPS Accuracy: ±{Math.round(currentLocation.accuracy)}m
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <FiInfo className="h-6 w-6 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Work Area</h4>
            </div>
            <p className="font-medium text-lg text-gray-900">150m radius required</p>
            <button
              onClick={() => {
                const [lng, lat] = complaint.location.coordinates;
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center transition-colors"
            >
              Open in Maps <FiExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Start Work Section */}
      {!workSession && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
            <FiPlay className="h-6 w-6 mr-3" />
            Start Work Session
          </h3>
          <p className="text-green-700 mb-6">
            You must be within 150m of the complaint location to start work.
          </p>
          
          {!locationValidation.isValid && locationValidation.distance && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <p className="text-yellow-800">
                  You are {locationValidation.distance}m away from the work area. Please move closer to start work.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onStartWork}
            disabled={isLoading || !currentLocation || !locationValidation.isValid}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-5 w-5 mr-3 animate-spin" />
                Starting Work...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiPlay className="h-5 w-5 mr-3" />
                Start Work Session
              </div>
            )}
          </button>
        </div>
      )}

      {/* Work Session Info */}
      {workSession && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FiActivity className="h-6 w-6 mr-3 text-blue-600" />
            Active Work Session
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Session ID</p>
              <p className="font-semibold text-gray-900 text-sm">{workSession.sessionId.slice(-8)}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-semibold text-gray-900 capitalize">{workSession.status}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Started At</p>
              <p className="font-semibold text-gray-900 text-sm">{new Date(workSession.startTime).toLocaleTimeString()}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Updates</p>
              <p className="font-semibold text-gray-900">{workSession.progressUpdates?.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

// Professional Work Tab Component
const ProfessionalWorkTab = ({ 
  workSession, 
  pauseReason, 
  setPauseReason, 
  onPause, 
  onResume, 
  isLoading, 
  locationValidation 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="space-y-8">
      {workSession?.status === 'paused' ? (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center">
            <FiPlay className="h-6 w-6 mr-3" />
            Resume Work Session
          </h3>
          <p className="text-yellow-700 mb-6">Your work is currently paused. Resume when ready to continue.</p>
          
          {!locationValidation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">
                  You must be within 150m of the work area to resume. You are {locationValidation.distance}m away.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onResume}
            disabled={isLoading || !locationValidation.isValid}
            className="w-full bg-yellow-600 text-white py-4 px-6 rounded-xl hover:bg-yellow-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-5 w-5 mr-3 animate-spin" />
                Resuming...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiPlay className="h-5 w-5 mr-3" />
                Resume Work Session
              </div>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
            <FiPause className="h-6 w-6 mr-3" />
            Pause Work Session
          </h3>
          <p className="text-orange-700 mb-6">
            Temporarily pause your work if needed (weather, resources, emergency, etc.).
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-orange-900 mb-2">
                Reason for pausing (required)
              </label>
              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g., Weather conditions, waiting for materials, emergency call..."
                className="w-full border border-orange-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <button
              onClick={onPause}
              disabled={isLoading || !pauseReason.trim()}
              className="w-full bg-orange-600 text-white py-4 px-6 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <FiRefreshCw className="h-5 w-5 mr-3 animate-spin" />
                  Pausing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FiPause className="h-5 w-5 mr-3" />
                  Pause Work Session
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

// Professional Progress Tab Component
const ProfessionalProgressTab = ({ 
  progressDescription, 
  setProgressDescription, 
  progressImages, 
  onImageUpload, 
  onRemoveImage, 
  onAddProgress, 
  isLoading,
  workSession 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center">
          <FiTarget className="h-6 w-6 mr-3" />
          Add Progress Update
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-purple-900 mb-2">
              Progress Description
            </label>
            <textarea
              value={progressDescription}
              onChange={(e) => setProgressDescription(e.target.value)}
              placeholder="Describe the progress made (e.g., materials gathered, work started, obstacles encountered)..."
              className="w-full border border-purple-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-900 mb-2">
              Progress Images (Optional - Max 3)
            </label>
            <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
                id="progress-images"
              />
              <label htmlFor="progress-images" className="cursor-pointer">
                <FiCamera className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                <p className="text-purple-700 font-medium">Click to upload images</p>
                <p className="text-purple-500 text-sm mt-1">PNG, JPG up to 10MB each</p>
              </label>
            </div>
            
            {progressImages.length > 0 && (
              <div className="mt-4 space-y-2">
                {progressImages.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-purple-100 rounded-xl px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <FiImage className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-purple-700 font-medium">{file.name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveImage(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onAddProgress}
            disabled={isLoading || !progressDescription.trim()}
            className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-5 w-5 mr-3 animate-spin" />
                Adding Progress...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiActivity className="h-5 w-5 mr-3" />
                Add Progress Update
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Previous Progress Updates */}
      {workSession?.progressUpdates && workSession.progressUpdates.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiActivity className="h-5 w-5 mr-2 text-gray-600" />
            Previous Updates
          </h4>
          <div className="space-y-4">
            {workSession.progressUpdates.map((update, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                    Update #{index + 1}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{update.description}</p>
                {update.images && update.images.length > 0 && (
                  <p className="text-xs text-blue-600 flex items-center">
                    <FiImage className="h-3 w-3 mr-1" />
                    {update.images.length} image(s) attached
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

// Professional Complete Tab Component
const ProfessionalCompleteTab = ({ 
  completionNotes, 
  setCompletionNotes, 
  completionImages, 
  onImageUpload, 
  onRemoveImage, 
  onComplete, 
  isLoading, 
  locationValidation 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center">
          <FiCheckCircle className="h-6 w-6 mr-3" />
          Complete Work Session
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-green-900 mb-2">
              Completion Notes *
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Describe what work was completed, materials used, final status..."
              className="w-full border border-green-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-900 mb-2">
              Completion Images * (Required - Max 5)
            </label>
            <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
                id="completion-images"
              />
              <label htmlFor="completion-images" className="cursor-pointer">
                <FiUpload className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-700 font-medium">Upload completion images</p>
                <p className="text-green-500 text-sm mt-1">Clear images showing completed work</p>
              </label>
            </div>
            
            {completionImages.length > 0 && (
              <div className="mt-4 space-y-2">
                {completionImages.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-100 rounded-xl px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <FiImage className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">{file.name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveImage(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!locationValidation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">
                  You must be within 150m of the work area to complete work. You are {locationValidation.distance}m away.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onComplete}
            disabled={isLoading || !completionNotes.trim() || completionImages.length === 0 || !locationValidation.isValid}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-5 w-5 mr-3 animate-spin" />
                Completing Work...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiCheckCircle className="h-5 w-5 mr-3" />
                Complete Work Session
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// Professional Submit Tab Component
const ProfessionalSubmitTab = ({ workSession, onSubmit, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
          <FiSend className="h-6 w-6 mr-3" />
          Submit for Admin Review
        </h3>
        
        <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-6">
          <h4 className="font-bold text-gray-900 mb-4">Work Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="font-bold text-lg text-gray-900">{workSession?.durationFormatted || 'Calculating...'}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Updates</p>
              <p className="font-bold text-lg text-gray-900">{workSession?.progressUpdates?.length || 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Images</p>
              <p className="font-bold text-lg text-gray-900">{workSession?.completionImages?.length || 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-bold text-lg text-gray-900 capitalize">{workSession?.status}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <p className="text-yellow-800">
              Once submitted, your work will be reviewed by an admin. You cannot make changes after submission.
            </p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <FiRefreshCw className="h-5 w-5 mr-3 animate-spin" />
              Submitting...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <FiSend className="h-5 w-5 mr-3" />
              Submit for Review
            </div>
          )}
        </button>
      </div>
    </div>
  </motion.div>
);

export default ProfessionalWorkSessionModal;