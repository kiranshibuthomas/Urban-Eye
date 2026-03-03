import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEye,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiImage,
  FiRefreshCw,
  FiStar,
  FiActivity,
  FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminFieldWorkReview = () => {
  const [workLogs, setWorkLogs] = useState([]);
  const [selectedWorkLog, setSelectedWorkLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    fieldStaff: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch pending work logs
  const fetchWorkLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '10',
        ...filters
      });

      const response = await fetch(`/api/admin/field-work/pending-reviews?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkLogs(data.workLogs);
          setPagination(data.pagination);
        }
      } else {
        throw new Error('Failed to fetch work logs');
      }
    } catch (error) {
      console.error('Fetch work logs error:', error);
      toast.error('Failed to load work logs');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.currentPage]);

  // Handle review
  const handleReview = async (workLogId, reviewStatus, reviewNotes, qualityScore) => {
    try {
      const response = await fetch(`/api/admin/field-work/review/${workLogId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reviewStatus,
          reviewNotes,
          qualityScore
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Work ${reviewStatus} successfully`);
        setIsReviewModalOpen(false);
        setSelectedWorkLog(null);
        fetchWorkLogs();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // View work log details
  const viewWorkLogDetails = async (workLogId) => {
    try {
      const response = await fetch(`/api/admin/field-work/work-log/${workLogId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedWorkLog(data.workLog);
          setIsReviewModalOpen(true);
        }
      } else {
        throw new Error('Failed to fetch work log details');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Initialize
  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      needs_revision: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Field Work Review</h1>
              <p className="text-gray-600 mt-1">Review and approve field staff work submissions</p>
            </div>
            <button
              onClick={fetchWorkLogs}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_revision">Needs Revision</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchWorkLogs}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Work Logs List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Work Submissions ({pagination.totalItems})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : workLogs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {workLogs.map((workLog) => (
                <WorkLogCard
                  key={workLog._id}
                  workLog={workLog}
                  onView={() => viewWorkLogDetails(workLog._id)}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No work logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No work submissions match your current filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedWorkLog && (
          <WorkLogReviewModal
            workLog={selectedWorkLog}
            onClose={() => {
              setIsReviewModalOpen(false);
              setSelectedWorkLog(null);
            }}
            onReview={handleReview}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Work Log Card Component
const WorkLogCard = ({ workLog, onView, getStatusColor, getPriorityColor }) => (
  <div className="p-6 hover:bg-gray-50 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {workLog.complaint?.title}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(workLog.complaint?.priority)}`}>
            {workLog.complaint?.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workLog.reviewStatus)}`}>
            {workLog.reviewStatus.replace('_', ' ')}
          </span>
        </div>
        
        <p className="text-gray-600 mb-3 line-clamp-2">{workLog.complaint?.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <FiUser className="h-4 w-4 mr-2" />
            <span>{workLog.fieldStaff?.name}</span>
          </div>
          <div className="flex items-center">
            <FiClock className="h-4 w-4 mr-2" />
            <span>{workLog.durationFormatted}</span>
          </div>
          <div className="flex items-center">
            <FiActivity className="h-4 w-4 mr-2" />
            <span>{workLog.progressUpdates?.length || 0} updates</span>
          </div>
          <div className="flex items-center">
            <FiImage className="h-4 w-4 mr-2" />
            <span>{workLog.completionImages?.length || 0} images</span>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          <span>Submitted: {new Date(workLog.submittedAt).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="ml-4">
        <button
          onClick={onView}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <FiEye className="h-4 w-4 mr-2" />
          Review
        </button>
      </div>
    </div>
  </div>
);

// Work Log Review Modal Component
const WorkLogReviewModal = ({ workLog, onClose, onReview }) => {
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [qualityScore, setQualityScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (reviewStatus === 'rejected' && !reviewNotes.trim()) {
      toast.error('Review notes are required for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReview(workLog._id, reviewStatus, reviewNotes, qualityScore);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Work Log Review</h2>
              <p className="text-gray-600 mt-1">{workLog.complaint?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Work Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Session Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Field Staff</p>
                    <p className="font-medium">{workLog.fieldStaff?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department</p>
                    <p className="font-medium">{workLog.fieldStaff?.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium">{workLog.durationFormatted}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Distance from Site</p>
                    <p className="font-medium">{workLog.distanceFromComplaint}m</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Started</p>
                    <p className="font-medium">{new Date(workLog.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completed</p>
                    <p className="font-medium">{new Date(workLog.endTime).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Progress Updates */}
              {workLog.progressUpdates && workLog.progressUpdates.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Progress Updates</h4>
                  <div className="space-y-3">
                    {workLog.progressUpdates.map((update, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900">
                            Update #{index + 1}
                          </span>
                          <span className="text-xs text-blue-600">
                            {new Date(update.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{update.description}</p>
                        {update.images && update.images.length > 0 && (
                          <p className="text-xs text-blue-600 mt-2">
                            {update.images.length} image(s) attached
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Details */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-900 mb-4">Work Completion</h4>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-gray-700 mb-3">{workLog.completionNotes}</p>
                  {workLog.completionImages && workLog.completionImages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-2">
                        Completion Images ({workLog.completionImages.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {workLog.completionImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.url}
                              alt={`Completion ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => window.open(image.url, '_blank')}
                              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                            >
                              <FiExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review Form */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Approval</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Decision
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="approved">Approve Work</option>
                      <option value="rejected">Reject Work</option>
                      <option value="needs_revision">Needs Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Score (1-5)
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => setQualityScore(score)}
                          className={`p-2 rounded-lg transition-colors ${
                            qualityScore >= score
                              ? 'text-yellow-500'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <FiStar className="h-5 w-5 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {qualityScore}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes {reviewStatus === 'rejected' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Provide feedback on the work quality, completeness, and any issues..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmitting}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                        reviewStatus === 'approved'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : reviewStatus === 'rejected'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          {reviewStatus === 'approved' ? (
                            <FiCheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <FiXCircle className="h-4 w-4 mr-2" />
                          )}
                          {reviewStatus === 'approved' ? 'Approve Work' : 
                           reviewStatus === 'rejected' ? 'Reject Work' : 'Request Revision'}
                        </div>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminFieldWorkReview;