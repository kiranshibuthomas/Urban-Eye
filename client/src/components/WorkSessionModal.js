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
  FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCurrentPosition, calculateDistance, formatDuration } from '../utils/locationUtils';

const WorkSessionModal = ({ complaint, activeSession, onClose }) => {
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
        ? `✅ Within work area (${distance}m away)` 
        : `⚠️ ${distance}m from work area (max: 150m)`
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
    if (workSession && workSession.status === 'started' || workSession?.status === 'resumed') {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Work Session</h2>
              <p className="text-gray-600 mt-1">{complaint.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Work Timer */}
          {workSession && (workSession.status === 'started' || workSession.status === 'resumed') && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiClock className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Work in Progress</span>
                </div>
                <div className="text-green-800 font-bold text-lg">
                  {formatDuration(workTimer)}
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'location', label: 'Location', icon: FiMapPin },
              { id: 'work', label: 'Work Management', icon: FiActivity },
              { id: 'progress', label: 'Progress Updates', icon: FiTarget },
              { id: 'complete', label: 'Complete Work', icon: FiCheckCircle },
              { id: 'submit', label: 'Submit', icon: FiSend }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isDisabled = 
                (tab.id === 'work' && !workSession) ||
                (tab.id === 'progress' && (!workSession || workSession.status === 'paused')) ||
                (tab.id === 'complete' && (!workSession || workSession.status !== 'started' && workSession.status !== 'resumed')) ||
                (tab.id === 'submit' && (!workSession || workSession.status !== 'completed'));

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed'
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
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'location' && (
              <LocationTab
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
              <WorkTab
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
              <ProgressTab
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
              <CompleteTab
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
              <SubmitTab
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

// Location Tab Component
const LocationTab = ({ 
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
  >
    <div className="space-y-6">
      {/* Location Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">Location Verification</h3>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-2">Current Status</p>
            <p className={`font-medium ${
              locationValidation.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {locationValidation.message}
            </p>
            {currentLocation && (
              <p className="text-xs text-gray-500 mt-1">
                Accuracy: ±{Math.round(currentLocation.accuracy)}m
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-2">Work Area</p>
            <p className="font-medium text-gray-900">150m radius required</p>
            <button
              onClick={() => {
                const [lng, lat] = complaint.location.coordinates;
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
            >
              Open in Maps <FiExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Start Work */}
      {!workSession && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Start Work</h3>
          <p className="text-green-700 mb-4">
            You must be within 150m of the complaint location to start work.
          </p>
          
          {!locationValidation.isValid && locationValidation.distance && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  You are {locationValidation.distance}m away from the work area. Please move closer to start work.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onStartWork}
            disabled={isLoading || !currentLocation || !locationValidation.isValid}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
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
        </div>
      )}

      {/* Work Session Info */}
      {workSession && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Session Active</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Session ID</p>
              <p className="font-medium">{workSession.sessionId}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium capitalize">{workSession.status}</p>
            </div>
            <div>
              <p className="text-gray-600">Started At</p>
              <p className="font-medium">{new Date(workSession.startTime).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Progress Updates</p>
              <p className="font-medium">{workSession.progressUpdates?.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

// Work Tab Component
const WorkTab = ({ 
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
  >
    <div className="space-y-6">
      {workSession?.status === 'paused' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Resume Work</h3>
          <p className="text-yellow-700 mb-4">Your work is currently paused. Resume when ready to continue.</p>
          
          {!locationValidation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">
                  You must be within 150m of the work area to resume. You are {locationValidation.distance}m away.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onResume}
            disabled={isLoading || !locationValidation.isValid}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resuming...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiPlay className="h-4 w-4 mr-2" />
                Resume Work
              </div>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Pause Work</h3>
          <p className="text-orange-700 mb-4">
            Temporarily pause your work if needed (weather, resources, emergency, etc.).
          </p>
          
          <textarea
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            placeholder="Reason for pausing (required)..."
            className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
            rows={3}
          />

          <button
            onClick={onPause}
            disabled={isLoading || !pauseReason.trim()}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Pausing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiPause className="h-4 w-4 mr-2" />
                Pause Work
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  </motion.div>
);

// Progress Tab Component
const ProgressTab = ({ 
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
  >
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Add Progress Update</h3>
        
        <textarea
          value={progressDescription}
          onChange={(e) => setProgressDescription(e.target.value)}
          placeholder="Describe the progress made (e.g., materials gathered, work started, obstacles encountered)..."
          className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
          rows={4}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-purple-700 mb-2">
            Progress Images (Optional - Max 3)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageUpload}
            className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm"
          />
          
          {progressImages.length > 0 && (
            <div className="mt-3 space-y-2">
              {progressImages.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-purple-100 rounded-lg px-3 py-2">
                  <div className="flex items-center">
                    <FiImage className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="text-sm text-purple-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="text-red-500 hover:text-red-700 p-1"
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
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Adding Progress...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <FiActivity className="h-4 w-4 mr-2" />
              Add Progress Update
            </div>
          )}
        </button>
      </div>

      {/* Previous Progress Updates */}
      {workSession?.progressUpdates && workSession.progressUpdates.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Previous Updates</h4>
          <div className="space-y-3">
            {workSession.progressUpdates.map((update, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Update #{index + 1}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{update.description}</p>
                {update.images && update.images.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
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

// Complete Tab Component
const CompleteTab = ({ 
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
  >
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Complete Work</h3>
        
        <textarea
          value={completionNotes}
          onChange={(e) => setCompletionNotes(e.target.value)}
          placeholder="Describe what work was completed, materials used, final status..."
          className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
          rows={4}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-green-700 mb-2">
            Completion Images * (Required - Max 5)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageUpload}
            className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-green-600 mt-1">
            Upload clear images showing the completed work
          </p>
          
          {completionImages.length > 0 && (
            <div className="mt-3 space-y-2">
              {completionImages.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-green-100 rounded-lg px-3 py-2">
                  <div className="flex items-center">
                    <FiImage className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!locationValidation.isValid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">
                You must be within 150m of the work area to complete work. You are {locationValidation.distance}m away.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onComplete}
          disabled={isLoading || !completionNotes.trim() || completionImages.length === 0 || !locationValidation.isValid}
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
      </div>
    </div>
  </motion.div>
);

// Submit Tab Component
const SubmitTab = ({ workSession, onSubmit, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
  >
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Submit for Admin Review</h3>
        
        <div className="bg-white rounded-lg p-4 border border-blue-100 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Work Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Duration</p>
              <p className="font-medium">{workSession?.durationFormatted || 'Calculating...'}</p>
            </div>
            <div>
              <p className="text-gray-600">Progress Updates</p>
              <p className="font-medium">{workSession?.progressUpdates?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Completion Images</p>
              <p className="font-medium">{workSession?.completionImages?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium capitalize">{workSession?.status}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 text-sm">
              Once submitted, your work will be reviewed by an admin. You cannot make changes after submission.
            </p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <FiSend className="h-4 w-4 mr-2" />
              Submit for Review
            </div>
          )}
        </button>
      </div>
    </div>
  </motion.div>
);

export default WorkSessionModal;