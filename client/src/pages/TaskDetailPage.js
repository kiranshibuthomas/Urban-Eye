import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiMapPin, FiClock, FiUser, FiAlertCircle,
  FiImage, FiPhone, FiTag, FiPlay, FiCheckCircle, FiActivity,
  FiNavigation, FiCamera, FiUpload, FiPlus, FiX, FiCheck,
  FiRefreshCw, FiAlertTriangle, FiList, FiMessageSquare, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { calculateDistance, formatDistance } from '../utils/locationUtils';

// Loaded in its own chunk so leaflet's module-level icon setup
// doesn't run inside the lazy TaskDetailPage chunk (avoids init error)
const TaskLocationMap = React.lazy(() => import('../components/TaskLocationMap'));

// Predetermined update templates per category
const UPDATE_TEMPLATES = {
  public_works: [
    'Arrived at the site and assessed the damage',
    'Gathered necessary tools and materials',
    'Work is underway – clearing debris',
    'Repair work in progress',
    'Final inspection completed',
  ],
  water_supply: [
    'Arrived at site and located the issue',
    'Shut off water supply for repair',
    'Pipe/valve replacement in progress',
    'Testing water flow after repair',
    'Water supply restored and tested',
  ],
  sanitation: [
    'Arrived at site and assessed sanitation issue',
    'Protective equipment donned, work started',
    'Waste collection/cleaning in progress',
    'Area disinfected and cleaned',
    'Site cleared and sanitized',
  ],
  electricity: [
    'Arrived at site and assessed electrical issue',
    'Power isolated for safety',
    'Fault identified and repair started',
    'Wiring/component replacement in progress',
    'Power restored and tested',
  ],
  default: [
    'Arrived at the complaint location',
    'Assessed the issue on site',
    'Work started',
    'Work in progress',
    'Final checks completed',
  ],
};

const ALLOWED_RADIUS = 150; // meters

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [distance, setDistance] = useState(null);
  const [isNearby, setIsNearby] = useState(false);

  // Work flow state
  const [phase, setPhase] = useState('view'); // view | working | completing
  const [startingWork, setStartingWork] = useState(false);

  // Progress update state
  const [progressText, setProgressText] = useState('');
  const [progressImages, setProgressImages] = useState([]);
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [progressHistory, setProgressHistory] = useState([]);

  // Completion state
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofImages, setProofImages] = useState([]);
  const [completing, setCompleting] = useState(false);

  const proofInputRef = useRef(null);
  const progressInputRef = useRef(null);

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/field-work/complaints/${taskId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setTask(data.complaint);
        if (data.activeSession) {
          setActiveSession(data.activeSession);
          setPhase('working');
          setProgressHistory(data.activeSession.progressUpdates || []);
        }
      }
    } catch (err) {
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  // Auto-get location on mount
  useEffect(() => { getLocation(); }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    setGettingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setUserLocation(loc);
        setGettingLocation(false);
      },
      (err) => {
        setLocationError('Could not get your location. Please enable GPS.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  // Recalculate distance when location or task changes
  useEffect(() => {
    if (userLocation && task?.location?.coordinates) {
      const d = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        task.location.coordinates[1], task.location.coordinates[0]
      );
      setDistance(Math.round(d));
      setIsNearby(d <= ALLOWED_RADIUS);
    }
  }, [userLocation, task]);

  const handleStartWork = async () => {
    if (!userLocation) { toast.error('Location required to start work'); return; }
    if (!isNearby) { toast.error(`You must be within ${ALLOWED_RADIUS}m of the complaint`); return; }
    setStartingWork(true);
    try {
      const res = await fetch('/api/field-work/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ complaintId: taskId, location: userLocation }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Work started!');
        setActiveSession(data.workLog);
        setPhase('working');
        fetchTask();
      } else {
        toast.error(data.message || 'Failed to start work');
      }
    } catch (err) {
      toast.error('Failed to start work');
    } finally {
      setStartingWork(false);
    }
  };

  const handleProgressSubmit = async () => {
    if (!progressText.trim()) { toast.error('Please enter a progress update'); return; }
    if (!activeSession?.sessionId) { toast.error('No active session'); return; }
    setSubmittingProgress(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', activeSession.sessionId);
      formData.append('description', progressText);
      formData.append('location', JSON.stringify(userLocation || { latitude: 0, longitude: 0, accuracy: 0 }));
      progressImages.forEach(img => formData.append('images', img));

      const res = await fetch('/api/field-work/progress', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Progress updated');
        setProgressText('');
        setProgressImages([]);
        setProgressHistory(prev => [...prev, { description: progressText, timestamp: new Date().toISOString() }]);
      } else {
        toast.error(data.message || 'Failed to update progress');
      }
    } catch (err) {
      toast.error('Failed to update progress');
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleCompleteWork = async () => {
    if (!completionNotes.trim()) { toast.error('Please add completion notes'); return; }
    if (proofImages.length === 0) { toast.error('Please upload at least one proof image'); return; }
    if (!activeSession?.sessionId) { toast.error('No active session'); return; }
    setCompleting(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', activeSession.sessionId);
      formData.append('completionNotes', completionNotes);
      formData.append('location', JSON.stringify(userLocation || { latitude: 0, longitude: 0, accuracy: 0 }));
      proofImages.forEach(img => formData.append('completionImages', img));

      const res = await fetch('/api/field-work/complete', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        // Auto-submit for review
        await fetch('/api/field-work/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId: activeSession.sessionId }),
        });
        toast.success('Work completed and submitted for review!');
        navigate('/field-staff-dashboard');
      } else {
        toast.error(data.message || 'Failed to complete work');
      }
    } catch (err) {
      toast.error('Failed to complete work');
    } finally {
      setCompleting(false);
    }
  };

  const templates = UPDATE_TEMPLATES[task?.category] || UPDATE_TEMPLATES.default;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (!task) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <FiAlertCircle className="mx-auto h-12 w-12 text-red-400 mb-3" />
        <p className="text-gray-600 mb-4">Task not found</p>
        <button onClick={() => navigate('/field-staff-dashboard')} className="px-4 py-2 bg-slate-800 text-white rounded text-sm">Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 flex items-center justify-between h-14">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/field-staff-dashboard')} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Task Details</h1>
              <p className="text-xs text-gray-500">#{task._id.slice(-8)}</p>
            </div>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Rejection Banner – shown when work was sent back */}
        {task.workRejectionReason && task.status === 'assigned' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <FiAlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Work was rejected — please redo</p>
              <p className="text-sm text-red-700 mt-0.5">{task.workRejectionReason}</p>
            </div>
          </div>
        )}

        {/* Complaint Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex-1 pr-3">{task.title}</h2>
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{task.description}</p>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FiTag className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="capitalize">{task.category?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiMapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{task.address}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiUser className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{task.citizenName || task.citizen?.name}</span>
              {task.citizen?.phone && (
                <a href={`tel:${task.citizen.phone}`} className="flex items-center text-blue-600 ml-1">
                  <FiPhone className="h-3.5 w-3.5 mr-1" />{task.citizen.phone}
                </a>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <FiClock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>Reported {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Complaint images */}
          {task.images?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center"><FiImage className="mr-1 h-3.5 w-3.5" />Complaint Photos</p>
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {task.images.map((img, i) => (
                  <img key={i} src={img.url} alt="" className="h-20 w-20 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location / Proximity Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Embedded map */}
          {task.location?.coordinates?.length >= 2 && (task.location.coordinates[0] !== 0 || task.location.coordinates[1] !== 0) ? (
            <div className="relative">
              <React.Suspense fallback={<div style={{ height: '220px' }} className="bg-gray-100 flex items-center justify-center text-sm text-gray-500">Loading map...</div>}>
                <TaskLocationMap
                  lat={task.location.coordinates[1]}
                  lng={task.location.coordinates[0]}
                  title={task.title}
                  address={task.address}
                />
              </React.Suspense>
              {/* Navigate overlay button */}
              <button
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${task.location.coordinates[1]},${task.location.coordinates[0]}`, '_blank')}
                className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-colors"
              >
                <FiNavigation className="h-4 w-4" />
                Navigate
              </button>
            </div>
          ) : null}

          {/* Address row */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-gray-100">
            <div className="flex items-start gap-2 min-w-0">
              <FiMapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 truncate">{task.address}</p>
            </div>
            <button
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${task.location?.coordinates?.[1]},${task.location?.coordinates?.[0]}`, '_blank')}
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <FiExternalLink className="h-3.5 w-3.5" />
              Open Maps
            </button>
          </div>

          {/* Proximity row */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <FiNavigation className="h-3.5 w-3.5 text-blue-500" />Your Distance
              </h3>
              <button onClick={getLocation} disabled={gettingLocation} className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700">
                <FiRefreshCw className={`h-3.5 w-3.5 ${gettingLocation ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {gettingLocation && <p className="text-sm text-gray-500">Getting your location...</p>}
            {locationError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <FiAlertTriangle className="h-4 w-4" />
                <span>{locationError}</span>
              </div>
            )}
            {distance !== null && !gettingLocation && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isNearby ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isNearby ? 'bg-green-500' : 'bg-orange-500'}`} />
                <div>
                  <p className={`text-sm font-medium ${isNearby ? 'text-green-800' : 'text-orange-800'}`}>
                    {isNearby ? `You're at the site (${formatDistance(distance)} away)` : `${formatDistance(distance)} from complaint`}
                  </p>
                  <p className={`text-xs ${isNearby ? 'text-green-600' : 'text-orange-600'}`}>
                    {isNearby ? 'Ready to start work' : `Must be within ${ALLOWED_RADIUS}m to start`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── PHASE: VIEW – Start Work ── */}
        {phase === 'view' && task.status === 'assigned' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={handleStartWork}
            disabled={startingWork || !isNearby || gettingLocation}
            className={`w-full py-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
              isNearby && !startingWork ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {startingWork ? <FiRefreshCw className="h-5 w-5 animate-spin" /> : <FiPlay className="h-5 w-5" />}
            <span>{startingWork ? 'Starting...' : isNearby ? 'Start Work' : `Get closer to start (${distance !== null ? formatDistance(distance) : '...'})`}</span>
          </motion.button>
        )}

        {/* Already in progress but no active session loaded */}
        {phase === 'view' && task.status === 'in_progress' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <FiActivity className="mx-auto h-6 w-6 text-blue-500 mb-2" />
            <p className="text-sm text-blue-800 font-medium">Work is in progress</p>
            <p className="text-xs text-blue-600 mt-1">Reload the page if your session isn't showing</p>
          </div>
        )}

        {/* ── PHASE: WORKING ── */}
        <AnimatePresence>
          {phase === 'working' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Active session banner */}
              <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                <div>
                  <p className="text-sm font-semibold">Work in Progress</p>
                  <p className="text-xs opacity-80">
                    Started {activeSession?.startTime ? new Date(activeSession.startTime).toLocaleTimeString() : 'just now'}
                  </p>
                </div>
              </div>

              {/* Progress History */}
              {progressHistory.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <FiList className="mr-2 h-4 w-4 text-gray-500" />Progress Log
                  </h3>
                  <div className="space-y-3">
                    {progressHistory.map((p, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-800">{p.description}</p>
                          <p className="text-xs text-gray-400">{new Date(p.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Progress Update */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <FiMessageSquare className="mr-2 h-4 w-4 text-gray-500" />Add Progress Update
                </h3>

                {/* Quick templates */}
                <p className="text-xs text-gray-500 mb-2">Quick updates:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {templates.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setProgressText(t)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-gray-200 rounded-full transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <textarea
                  value={progressText}
                  onChange={e => setProgressText(e.target.value)}
                  placeholder="Describe what you've done..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* Progress image attach */}
                <div className="flex items-center space-x-3 mt-3">
                  <button
                    onClick={() => progressInputRef.current?.click()}
                    className="flex items-center space-x-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                  >
                    <FiCamera className="h-3.5 w-3.5" />
                    <span>Attach Photo</span>
                  </button>
                  <input ref={progressInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => setProgressImages(Array.from(e.target.files))} />
                  {progressImages.length > 0 && (
                    <span className="text-xs text-blue-600">{progressImages.length} photo(s) selected</span>
                  )}
                </div>

                <button
                  onClick={handleProgressSubmit}
                  disabled={submittingProgress || !progressText.trim()}
                  className="mt-3 w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submittingProgress ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
                  <span>{submittingProgress ? 'Saving...' : 'Save Update'}</span>
                </button>
              </div>

              {/* Finish Work Button */}
              <button
                onClick={() => setPhase('completing')}
                className="w-full py-3.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 flex items-center justify-center space-x-2"
              >
                <FiCheckCircle className="h-5 w-5" />
                <span>Finish Work</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PHASE: COMPLETING ── */}
        <AnimatePresence>
          {phase === 'completing' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Complete Work</h3>
                <p className="text-xs text-gray-500 mb-4">Add completion notes and upload proof of work done.</p>

                {/* Completion notes */}
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Completion Notes *</label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Describe the work completed, materials used, outcome..."
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-4"
                />

                {/* Quick completion templates */}
                <p className="text-xs text-gray-500 mb-2">Quick notes:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(UPDATE_TEMPLATES[task?.category] || UPDATE_TEMPLATES.default).slice(-2).map((t, i) => (
                    <button key={i} onClick={() => setCompletionNotes(t)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 rounded-full transition-colors">
                      {t}
                    </button>
                  ))}
                </div>

                {/* Proof image upload */}
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Proof Images *</label>
                <div
                  onClick={() => proofInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                >
                  <FiUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload proof photos</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5 images</p>
                </div>
                <input ref={proofInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => setProofImages(Array.from(e.target.files))} />

                {/* Preview selected proof images */}
                {proofImages.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {proofImages.map((file, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(file)} alt="" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                        <button
                          onClick={() => setProofImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setPhase('working')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCompleteWork}
                  disabled={completing || !completionNotes.trim() || proofImages.length === 0}
                  className="flex-2 flex-grow py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {completing ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiCheckCircle className="h-4 w-4" />}
                  <span>{completing ? 'Submitting...' : 'Submit & Complete'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// ── Small helper components ──

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    work_completed: 'bg-emerald-100 text-emerald-800',
    resolved: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const map = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${map[priority] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {priority}
    </span>
  );
};

export default TaskDetailPage;
