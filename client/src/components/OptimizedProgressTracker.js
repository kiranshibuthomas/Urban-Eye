import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPlay,
  FiPause,
  FiTarget,
  FiActivity,
  FiMapPin,
  FiCamera,
  FiFileText,
  FiUser,
  FiCalendar,
  FiTrendingUp,
  FiBarChart2,
  FiRefreshCw,
  FiEdit3,
  FiSave,
  FiX,
  FiInfo,
  FiZap,
  FiShield,
  FiNavigation
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const OptimizedProgressTracker = ({ complaint, onStatusUpdate, onProgressUpdate, onWorkComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [workNotes, setWorkNotes] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofImages, setProofImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [workDuration, setWorkDuration] = useState(0);
  const [progressHistory, setProgressHistory] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [actualTime, setActualTime] = useState(0);

  // Optimized workflow steps with better logic
  const workflowSteps = useMemo(() => {
    const steps = [
      {
        id: 1,
        title: 'Review',
        shortTitle: 'Review',
        description: 'Review complaint details',
        icon: FiInfo,
        color: 'blue',
        status: 'completed',
        required: true,
        estimatedTime: 5 // minutes
      },
      {
        id: 2,
        title: 'Start Work',
        shortTitle: 'Start',
        description: 'Begin working on the complaint',
        icon: FiPlay,
        color: 'green',
        status: complaint.status === 'assigned' ? 'current' : 
                ['in_progress', 'work_completed', 'resolved'].includes(complaint.status) ? 'completed' : 'pending',
        required: true,
        estimatedTime: 0
      },
      {
        id: 3,
        title: 'Work in Progress',
        shortTitle: 'Working',
        description: 'Actively working on the complaint',
        icon: FiActivity,
        color: 'yellow',
        status: complaint.status === 'in_progress' ? 'current' : 
                ['work_completed', 'resolved'].includes(complaint.status) ? 'completed' : 'pending',
        required: true,
        estimatedTime: 30 // minutes
      },
      {
        id: 4,
        title: 'Complete Work',
        shortTitle: 'Complete',
        description: 'Mark work as completed',
        icon: FiCheckCircle,
        color: 'purple',
        status: complaint.status === 'work_completed' ? 'current' : 
                complaint.status === 'resolved' ? 'completed' : 'pending',
        required: true,
        estimatedTime: 10 // minutes
      },
      {
        id: 5,
        title: 'Approval',
        shortTitle: 'Approval',
        description: 'Awaiting admin approval',
        icon: FiShield,
        color: 'gray',
        status: complaint.status === 'resolved' ? 'completed' : 'pending',
        required: false,
        estimatedTime: 0
      }
    ];

    return steps;
  }, [complaint.status]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / workflowSteps.length) * 100);
  }, [workflowSteps]);

  // Calculate estimated vs actual time
  const timeAnalysis = useMemo(() => {
    const estimated = workflowSteps.reduce((total, step) => total + step.estimatedTime, 0);
    const actual = workDuration;
    const efficiency = estimated > 0 ? Math.round((estimated / actual) * 100) : 0;
    
    return {
      estimated,
      actual,
      efficiency,
      isOverTime: actual > estimated,
      timeSaved: estimated - actual
    };
  }, [workflowSteps, workDuration]);

  // Get step color classes
  const getStepColor = (color, status) => {
    const baseColors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500'
    };
    
    if (status === 'completed') return 'bg-green-500';
    if (status === 'current') return baseColors[color] || 'bg-blue-500';
    return 'bg-gray-300';
  };

  // Quick actions for efficiency
  const quickActions = [
    {
      id: 'start-work',
      title: 'Start Work',
      icon: FiPlay,
      color: 'green',
      action: handleStartWork,
      visible: complaint.status === 'assigned'
    },
    {
      id: 'update-progress',
      title: 'Quick Update',
      icon: FiEdit3,
      color: 'yellow',
      action: () => setShowQuickActions(true),
      visible: complaint.status === 'in_progress'
    },
    {
      id: 'complete-work',
      title: 'Complete',
      icon: FiCheckCircle,
      color: 'purple',
      action: () => setShowQuickActions(true),
      visible: complaint.status === 'in_progress'
    },
    {
      id: 'view-location',
      title: 'Location',
      icon: FiMapPin,
      color: 'blue',
      action: () => window.open(`https://maps.google.com/?q=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`, '_blank'),
      visible: true
    }
  ];

  // Optimized start work function
  async function handleStartWork() {
    setIsLoading(true);
    try {
      setWorkStartTime(new Date());
      await onStatusUpdate(complaint._id, 'in_progress', 'Started working on the complaint');
      setCurrentStep(2);
      toast.success('Work started! 🚀');
    } catch (error) {
      console.error('Start work error:', error);
      toast.error(`Failed to start work: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Optimized progress update
  const handleQuickProgressUpdate = async (template) => {
    setIsLoading(true);
    try {
      const note = template || progressNotes;
      
      // Use the appropriate function based on complaint status
      if (complaint.status === 'assigned') {
        // Start work and add note
        await onStatusUpdate(complaint._id, 'in_progress', note);
      } else if (complaint.status === 'in_progress') {
        // For now, use status update endpoint as fallback
        try {
          await onProgressUpdate(complaint._id, note);
        } catch (progressError) {
          // Fallback to status update endpoint
          await onStatusUpdate(complaint._id, 'in_progress', note);
        }
      }
      
      toast.success('Progress updated! 📝');
      setProgressNotes('');
      setShowQuickActions(false);
    } catch (error) {
      console.error('Progress update error:', error);
      toast.error(`Failed to update progress: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setProofImages(prev => [...prev, ...files]);
  };

  // Remove image from proof images
  const removeImage = (index) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle work completion with mandatory proof images
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

  // Progress templates for efficiency
  const progressTemplates = [
    'Arrived at location and assessing the situation',
    'Work in progress - making good progress',
    'Encountered minor issues but continuing',
    'Work nearly complete, finalizing details',
    'Work completed successfully'
  ];

  // Calculate work duration
  useEffect(() => {
    if (workStartTime && complaint.status === 'in_progress') {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - workStartTime) / (1000 * 60));
        setWorkDuration(diff);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [workStartTime, complaint.status]);

  // Format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        {/* Optimized Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Complaint Management</h2>
              <p className="text-gray-600 mt-1">{complaint.title}</p>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-4"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center">
                <FiClock className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Work Time</p>
                  <p className="text-lg font-bold text-blue-800">{formatDuration(workDuration)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <FiTarget className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">Estimated</p>
                  <p className="text-lg font-bold text-green-800">{formatDuration(timeAnalysis.estimated)}</p>
                </div>
              </div>
            </div>
            
            <div className={`border rounded-xl p-4 ${timeAnalysis.isOverTime ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center">
                <FiTrendingUp className={`h-5 w-5 mr-2 ${timeAnalysis.isOverTime ? 'text-red-600' : 'text-yellow-600'}`} />
                <div>
                  <p className={`text-sm font-medium ${timeAnalysis.isOverTime ? 'text-red-900' : 'text-yellow-900'}`}>
                    {timeAnalysis.isOverTime ? 'Over Time' : 'On Track'}
                  </p>
                  <p className={`text-lg font-bold ${timeAnalysis.isOverTime ? 'text-red-800' : 'text-yellow-800'}`}>
                    {timeAnalysis.efficiency}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center">
                <FiBarChart2 className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Progress</p>
                  <p className="text-lg font-bold text-purple-800">{progressPercentage}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Optimized Workflow Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      step.status === 'completed' ? 'bg-green-50 border-green-200' :
                      step.status === 'current' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        getStepColor(step.color, step.status)
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          step.status === 'completed' || step.status === 'current' ? 'text-white' : 'text-gray-500'
                        }`} />
                      </div>
                      <h4 className={`font-semibold text-sm mb-1 ${
                        step.status === 'completed' ? 'text-green-800' :
                        step.status === 'current' ? 'text-blue-800' :
                        'text-gray-600'
                      }`}>
                        {step.shortTitle}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">{step.description}</p>
                      {step.estimatedTime > 0 && (
                        <p className="text-xs text-gray-400">
                          ~{step.estimatedTime}m
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.filter(action => action.visible).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      action.color === 'green' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                      action.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                      action.color === 'purple' ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' :
                      'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${
                      action.color === 'green' ? 'text-green-600' :
                      action.color === 'yellow' ? 'text-yellow-600' :
                      action.color === 'purple' ? 'text-purple-600' :
                      'text-blue-600'
                    }`} />
                    <span className="text-sm font-medium text-gray-700">{action.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Templates */}
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Progress Updates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {progressTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickProgressUpdate(template)}
                    className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    {template}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Or write your own progress update..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => setShowQuickActions(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleQuickProgressUpdate()}
                    disabled={!progressNotes.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Work Completion Form */}
          {complaint.status === 'in_progress' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiCheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                Complete Work
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Notes *
                  </label>
                  <textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Describe what work was completed, materials used, time taken, etc..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof Images * (Required)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload photos showing the completed work. At least one image is required.
                  </p>
                  
                  {proofImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Selected Images ({proofImages.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {proofImages.map((file, index) => (
                          <div key={index} className="flex items-center bg-purple-100 rounded-lg px-3 py-2">
                            <FiCamera className="h-4 w-4 text-purple-600 mr-2" />
                            <span className="text-sm text-purple-700 mr-2">{file.name}</span>
                            <button
                              onClick={() => removeImage(index)}
                              className="text-purple-500 hover:text-purple-700"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCompleteWork}
                    disabled={isLoading || !completionNotes.trim() || proofImages.length === 0}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Completing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FiCheckCircle className="h-4 w-4 mr-2" />
                        Complete Work
                      </div>
                    )}
                  </button>
                </div>

                {proofImages.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <FiAlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <p className="text-sm text-red-700">
                        <strong>Proof images are mandatory</strong> for work completion. Please upload at least one image showing the completed work.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OptimizedProgressTracker;
