import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCamera,
  FiFileText,
  FiMapPin,
  FiNavigation,
  FiUpload,
  FiX,
  FiEdit3,
  FiSave,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiMessageSquare,
  FiActivity,
  FiTarget,
  FiCheck,
  FiXCircle,
  FiInfo,
  FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FieldStaffWorkflow = ({ complaint, onStatusUpdate, onWorkComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [workNotes, setWorkNotes] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofImages, setProofImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [workDuration, setWorkDuration] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Workflow steps configuration
  const workflowSteps = [
    {
      id: 1,
      title: 'Review & Accept',
      description: 'Review complaint details and accept the assignment',
      icon: FiInfo,
      color: 'blue',
      status: complaint.status === 'assigned' ? 'current' : 'completed'
    },
    {
      id: 2,
      title: 'Start Work',
      description: 'Begin working on the complaint',
      icon: FiPlay,
      color: 'green',
      status: complaint.status === 'in_progress' ? 'current' : 
              complaint.status === 'work_completed' || complaint.status === 'resolved' ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: 'Update Progress',
      description: 'Provide regular progress updates',
      icon: FiActivity,
      color: 'yellow',
      status: complaint.status === 'work_completed' || complaint.status === 'resolved' ? 'completed' : 'pending'
    },
    {
      id: 4,
      title: 'Complete Work',
      description: 'Mark work as completed with proof',
      icon: FiCheckCircle,
      color: 'purple',
      status: complaint.status === 'work_completed' ? 'current' : 
              complaint.status === 'resolved' ? 'completed' : 'pending'
    },
    {
      id: 5,
      title: 'Await Approval',
      description: 'Wait for admin approval',
      icon: FiClock,
      color: 'gray',
      status: complaint.status === 'resolved' ? 'completed' : 'pending'
    }
  ];

  const getStepColor = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  const getStepStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      current: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const handleStartWork = async () => {
    setIsLoading(true);
    try {
      setWorkStartTime(new Date());
      await onStatusUpdate(complaint._id, 'in_progress', 'Started working on the complaint');
      setCurrentStep(2);
      toast.success('Work started successfully! 🚀');
    } catch (error) {
      console.error('Start work error:', error);
      toast.error(`Failed to start work: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressNotes.trim()) {
      toast.error('Please provide progress notes');
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

  const handleCompleteWork = async () => {
    if (!completionNotes.trim()) {
      toast.error('Please provide completion notes');
      return;
    }

    if (proofImages.length === 0) {
      toast.error('Proof images are mandatory for work completion');
      return;
    }

    setIsLoading(true);
    try {
      await onWorkComplete(complaint._id, completionNotes, proofImages);
      setCurrentStep(4);
      toast.success('Work completed successfully! Awaiting admin approval. ✅');
    } catch (error) {
      console.error('Complete work error:', error);
      toast.error(`Failed to complete work: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setProofImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate work duration
  useEffect(() => {
    if (workStartTime && complaint.status === 'in_progress') {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - workStartTime) / (1000 * 60));
        setWorkDuration(diff);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [workStartTime, complaint.status]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complaint Management</h2>
              <p className="text-gray-600 mt-1">{complaint.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Work Progress */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Progress</h3>
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'current' ? getStepColor(step.color) :
                      'bg-gray-300'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        step.status === 'completed' || step.status === 'current' ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        step.status === 'completed' ? 'text-green-800' :
                        step.status === 'current' ? 'text-blue-800' :
                        'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className={`absolute top-6 left-1/2 w-full h-0.5 ${
                        step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`} style={{ transform: 'translateX(50%)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Timer */}
          {complaint.status === 'in_progress' && workStartTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiClock className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">Work in Progress</span>
                </div>
                <div className="text-blue-800 font-bold text-lg">
                  {formatDuration(workDuration)}
                </div>
              </div>
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Work Card */}
            {complaint.status === 'assigned' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  <FiPlay className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Start Work</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Review the complaint details and start working on the issue.
                </p>
                <button
                  onClick={handleStartWork}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
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

            {/* Update Progress Card */}
            {complaint.status === 'in_progress' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  <FiActivity className="h-6 w-6 text-yellow-600 mr-3" />
                  <h3 className="text-lg font-semibold text-yellow-900">Update Progress</h3>
                </div>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Describe the progress made..."
                  className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleUpdateProgress}
                  disabled={isLoading || !progressNotes.trim()}
                  className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
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
            {complaint.status === 'in_progress' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-50 border border-purple-200 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  <FiCheckCircle className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-900">Complete Work</h3>
                </div>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe what work was completed..."
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
                  rows={3}
                />
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Proof Images * (Required)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {proofImages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {proofImages.map((file, index) => (
                        <div key={index} className="flex items-center bg-purple-100 rounded-lg px-2 py-1">
                          <span className="text-xs text-purple-700 mr-2">{file.name}</span>
                          <button
                            onClick={() => removeImage(index)}
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCompleteWork}
                  disabled={isLoading || !completionNotes.trim() || proofImages.length === 0}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FiCheck className="h-4 w-4 mr-2" />
                      Complete Work
                    </div>
                  )}
                </button>
              </motion.div>
            )}

            {/* Work Completed Status */}
            {complaint.status === 'work_completed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  <FiCheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Work Completed</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Your work has been completed and is awaiting admin approval.
                </p>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Completion Notes:</strong> {complaint.workCompletionNotes}
                  </p>
                  {complaint.workCompletedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      Completed on {new Date(complaint.workCompletedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Work Approved Status */}
            {complaint.status === 'resolved' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  <FiCheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Work Approved</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Your work has been approved by the admin. The complaint is now resolved.
                </p>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Final Status:</strong> Resolved
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Approved on {new Date(complaint.resolvedAt || complaint.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <FiMapPin className="h-4 w-4 mr-2" />
                View Location
              </button>
              <button
                onClick={() => window.open(`https://maps.google.com/?q=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`, '_blank')}
                className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <FiNavigation className="h-4 w-4 mr-2" />
                Open in Maps
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FieldStaffWorkflow;
