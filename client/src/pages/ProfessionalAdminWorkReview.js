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
  FiExternalLink,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiTrendingUp,
  FiAward,
  FiBarChart2,
  FiDownload,
  FiMoreVertical,
  FiChevronDown,
  FiChevronRight,
  FiAlertCircle,
  FiCheck,
  FiTarget
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfessionalAdminWorkReview = () => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch work logs
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

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/field-work/statistics', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  }, []);

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
        fetchStatistics();
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
    fetchStatistics();
  }, [fetchWorkLogs, fetchStatistics]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      needs_revision: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Professional Header */}
      <div className="bg-white shadow-xl border-b border-gray-100">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiActivity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Field Work Review</h1>
                <p className="text-gray-600 mt-1">Review and approve field staff work submissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <FiFilter className="h-4 w-4 mr-2" />
                Filters
                <FiChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => {
                  fetchWorkLogs();
                  fetchStatistics();
                }}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="w-full px-2 sm:px-4 lg:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ProfessionalStatCard
              title="Pending Reviews"
              value={statistics.pendingReviews || 0}
              icon={FiClock}
              color="yellow"
              trend="Awaiting review"
            />
            <ProfessionalStatCard
              title="Approved Work"
              value={statistics.approvedWork || 0}
              icon={FiCheckCircle}
              color="green"
              trend="This month"
            />
            <ProfessionalStatCard
              title="Total Sessions"
              value={statistics.totalSessions || 0}
              icon={FiActivity}
              color="blue"
              trend="All time"
            />
            <ProfessionalStatCard
              title="Avg Quality"
              value={statistics.averageQualityScore ? `${statistics.averageQualityScore.toFixed(1)}/5` : 'N/A'}
              icon={FiStar}
              color="purple"
              trend="Quality score"
            />
          </div>
        </div>
      )}

      <div className="w-full px-2 sm:px-4 lg:px-6 pb-8">
        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="needs_revision">Needs Revision</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchWorkLogs}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Work Logs List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Work Submissions ({pagination.totalItems})
                </h2>
                <p className="text-gray-600 mt-1">Review field staff work submissions</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                  <FiMoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : workLogs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {workLogs.map((workLog) => (
                <ProfessionalWorkLogCard
                  key={workLog._id}
                  workLog={workLog}
                  onView={() => viewWorkLogDetails(workLog._id)}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FiClock className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No work logs found</h3>
              <p className="mt-2 text-gray-500">
                No work submissions match your current filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedWorkLog && (
          <ProfessionalWorkLogReviewModal
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

// Professional Stat Card Component
const ProfessionalStatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-600',
    green: 'from-green-500 to-green-600 text-green-600',
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{trend}</p>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-r ${colorClasses[color]} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Professional Work Log Card Component
const ProfessionalWorkLogCard = ({ workLog, onView, getStatusColor, getPriorityColor }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
    onClick={onView}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-3">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {workLog.complaint?.title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(workLog.complaint?.priority)}`}>
            {workLog.complaint?.priority}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(workLog.reviewStatus)}`}>
            {workLog.reviewStatus.replace('_', ' ')}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{workLog.complaint?.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <FiUser className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Field Staff</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.fieldStaff?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiClock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.durationFormatted}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiActivity className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Updates</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.progressUpdates?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiImage className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Images</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.completionImages?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span>Submitted: {new Date(workLog.submittedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiMapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500 truncate max-w-32">{workLog.complaint?.address}</span>
          </div>
        </div>
      </div>
      
      <div className="ml-6 flex flex-col items-end space-y-2">
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg">
          <FiEye className="h-4 w-4 mr-2" />
          Review
        </button>
        {workLog.qualityScore && (
          <div className="flex items-center space-x-1">
            <FiStar className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-700">{workLog.qualityScore}/5</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// Professional Work Log Review Modal Component
const ProfessionalWorkLogReviewModal = ({ workLog, onClose, onReview }) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <FiTarget className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Work Log Review</h2>
                <p className="text-blue-100 mt-1">{workLog.complaint?.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Work Details - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Info */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <FiUser className="h-6 w-6 mr-3 text-blue-600" />
                  Work Session Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Field Staff</p>
                    <p className="font-bold text-gray-900">{workLog.fieldStaff?.name}</p>
                    <p className="text-xs text-gray-500">{workLog.fieldStaff?.department}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="font-bold text-gray-900">{workLog.durationFormatted}</p>
                    <p className="text-xs text-gray-500">Total time</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Distance</p>
                    <p className="font-bold text-gray-900">{workLog.distanceFromComplaint}m</p>
                    <p className="text-xs text-gray-500">From site</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Started</p>
                    <p className="font-bold text-gray-900">{new Date(workLog.startTime).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(workLog.startTime).toLocaleTimeString()}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="font-bold text-gray-900">{new Date(workLog.endTime).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(workLog.endTime).toLocaleTimeString()}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Updates</p>
                    <p className="font-bold text-gray-900">{workLog.progressUpdates?.length || 0}</p>
                    <p className="text-xs text-gray-500">Progress logs</p>
                  </div>
                </div>
              </div>

              {/* Progress Updates */}
              {workLog.progressUpdates && workLog.progressUpdates.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                  <h4 className="text-xl font-bold text-purple-900 mb-6 flex items-center">
                    <FiActivity className="h-6 w-6 mr-3" />
                    Progress Updates
                  </h4>
                  <div className="space-y-4">
                    {workLog.progressUpdates.map((update, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full">
                            Update #{index + 1}
                          </span>
                          <span className="text-xs text-purple-600">
                            {new Date(update.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{update.description}</p>
                        {update.images && update.images.length > 0 && (
                          <p className="text-xs text-purple-600 flex items-center">
                            <FiImage className="h-3 w-3 mr-1" />
                            {update.images.length} image(s) attached
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Details */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <h4 className="text-xl font-bold text-green-900 mb-6 flex items-center">
                  <FiCheckCircle className="h-6 w-6 mr-3" />
                  Work Completion
                </h4>
                <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
                  <p className="text-gray-700 mb-4 leading-relaxed">{workLog.completionNotes}</p>
                  {workLog.completionImages && workLog.completionImages.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-green-900 mb-4 flex items-center">
                        <FiImage className="h-4 w-4 mr-2" />
                        Completion Images ({workLog.completionImages.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {workLog.completionImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.url}
                              alt={`Completion ${index + 1}`}
                              className="w-full h-32 object-cover rounded-xl shadow-sm group-hover:shadow-lg transition-shadow"
                            />
                            <button
                              onClick={() => window.open(image.url, '_blank')}
                              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
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

            {/* Review Form - 1/3 width */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <FiAward className="h-6 w-6 mr-3 text-blue-600" />
                  Review & Approval
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Review Decision
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    >
                      <option value="approved">✅ Approve Work</option>
                      <option value="rejected">❌ Reject Work</option>
                      <option value="needs_revision">🔄 Needs Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Quality Score (1-5)
                    </label>
                    <div className="flex items-center justify-between mb-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => setQualityScore(score)}
                          className={`p-3 rounded-xl transition-all duration-200 ${
                            qualityScore >= score
                              ? 'text-yellow-500 bg-yellow-50 scale-110'
                              : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'
                          }`}
                        >
                          <FiStar className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {qualityScore}/5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Review Notes {reviewStatus === 'rejected' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Provide feedback on the work quality, completeness, and any issues..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmitting}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                        reviewStatus === 'approved'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : reviewStatus === 'rejected'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <FiRefreshCw className="h-5 w-5 mr-3 animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          {reviewStatus === 'approved' ? (
                            <FiCheckCircle className="h-5 w-5 mr-3" />
                          ) : (
                            <FiXCircle className="h-5 w-5 mr-3" />
                          )}
                          {reviewStatus === 'approved' ? 'Approve Work' : 
                           reviewStatus === 'rejected' ? 'Reject Work' : 'Request Revision'}
                        </div>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                    >
                      Cancel Review
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

export default ProfessionalAdminWorkReview;