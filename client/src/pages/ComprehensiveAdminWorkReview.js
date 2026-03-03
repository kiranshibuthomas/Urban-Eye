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
  FiPrinter,
  FiMoreVertical,
  FiChevronDown,
  FiChevronRight,
  FiAlertCircle,
  FiCheck,
  FiTarget,
  FiNavigation,
  FiPlay,
  FiPause,
  FiInfo,
  FiFileText,
  FiCamera,
  FiZoomIn,
  FiMaximize2,
  FiMinimize2,
  FiRotateCw,
  FiShare2,
  FiEdit3,
  FiMessageSquare,
  FiFlag,
  FiShield,
  FiTool,
  FiLayers,
  FiGrid,
  FiList,
  FiHash,
  FiGlobe,
  FiWifi,
  FiSmartphone,
  FiBattery,
  FiSignal
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ComprehensiveAdminWorkReview = () => {
  const [workLogs, setWorkLogs] = useState([]);
  const [selectedWorkLog, setSelectedWorkLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    fieldStaff: '',
    startDate: '',
    endDate: '',
    priority: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  // Fetch work logs
  const fetchWorkLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '12',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-2xl border-b border-gray-100">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <FiShield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Work Review Center</h1>
                <p className="text-gray-600 mt-1">Comprehensive field staff work approval system</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  <FiGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  <FiList className="h-4 w-4" />
                </button>
              </div>
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

          {/* Enhanced Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <EnhancedStatCard
                title="Pending"
                value={statistics.pendingReviews || 0}
                icon={FiClock}
                color="yellow"
                subtitle="Awaiting review"
              />
              <EnhancedStatCard
                title="Approved"
                value={statistics.approvedWork || 0}
                icon={FiCheckCircle}
                color="green"
                subtitle="This month"
              />
              <EnhancedStatCard
                title="Rejected"
                value={statistics.rejectedWork || 0}
                icon={FiXCircle}
                color="red"
                subtitle="Needs rework"
              />
              <EnhancedStatCard
                title="Total Sessions"
                value={statistics.totalSessions || 0}
                icon={FiActivity}
                color="blue"
                subtitle="All time"
              />
              <EnhancedStatCard
                title="Avg Quality"
                value={statistics.averageQualityScore ? `${statistics.averageQualityScore.toFixed(1)}/5` : 'N/A'}
                icon={FiStar}
                color="purple"
                subtitle="Quality score"
              />
              <EnhancedStatCard
                title="Efficiency"
                value={statistics.averageWorkTime ? `${Math.round(statistics.averageWorkTime / 60000)}m` : 'N/A'}
                icon={FiTrendingUp}
                color="indigo"
                subtitle="Avg duration"
              />
            </div>
          )}
        </div>
      </div>
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
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="needs_revision">Needs Revision</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchWorkLogs}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Work Logs Display */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Work Submissions ({pagination.totalItems})
                </h2>
                <p className="text-gray-600 mt-1">Comprehensive review of field staff work</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                  <FiDownload className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                  <FiPrinter className="h-4 w-4" />
                </button>
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
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6' : 'divide-y divide-gray-100'}>
              {workLogs.map((workLog) => (
                viewMode === 'grid' ? (
                  <ComprehensiveWorkLogCard
                    key={workLog._id}
                    workLog={workLog}
                    onView={() => viewWorkLogDetails(workLog._id)}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                  />
                ) : (
                  <ComprehensiveWorkLogListItem
                    key={workLog._id}
                    workLog={workLog}
                    onView={() => viewWorkLogDetails(workLog._id)}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FiFileText className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No work submissions found</h3>
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
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
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

      {/* Comprehensive Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedWorkLog && (
          <ComprehensiveWorkLogReviewModal
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
// Enhanced Stat Card Component
const EnhancedStatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-600',
    green: 'from-green-500 to-green-600 text-green-600',
    red: 'from-red-500 to-red-600 text-red-600',
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Comprehensive Work Log Card Component
const ComprehensiveWorkLogCard = ({ workLog, onView, getStatusColor, getPriorityColor }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
    onClick={onView}
  >
    {/* Card Header */}
    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
          {workLog.complaint?.title}
        </h3>
        <div className="flex flex-col space-y-1 ml-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(workLog.complaint?.priority)}`}>
            {workLog.complaint?.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(workLog.reviewStatus)}`}>
            {workLog.reviewStatus.replace('_', ' ')}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{workLog.complaint?.description}</p>
    </div>

    {/* Card Body */}
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <FiUser className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Field Staff</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{workLog.fieldStaff?.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FiClock className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-semibold text-gray-900">{workLog.durationFormatted}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FiActivity className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-xs text-gray-500">Updates</p>
            <p className="text-sm font-semibold text-gray-900">{workLog.progressUpdates?.length || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FiImage className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">Images</p>
            <p className="text-sm font-semibold text-gray-900">{workLog.completionImages?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>Submitted: {new Date(workLog.submittedAt).toLocaleDateString()}</span>
        <span>{workLog.distanceFromComplaint}m from site</span>
      </div>

      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-lg">
        <FiEye className="h-4 w-4 mr-2 inline" />
        Review Work
      </button>
    </div>
  </motion.div>
);
// Comprehensive Work Log List Item Component
const ComprehensiveWorkLogListItem = ({ workLog, onView, getStatusColor, getPriorityColor }) => (
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
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <FiUser className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Staff</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.fieldStaff?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiClock className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.durationFormatted}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiActivity className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Updates</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.progressUpdates?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiImage className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Images</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.completionImages?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiNavigation className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-semibold text-gray-900">{workLog.distanceFromComplaint}m</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiCalendar className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="text-sm font-semibold text-gray-900">{new Date(workLog.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <FiMapPin className="h-3 w-3" />
            <span className="truncate max-w-48">{workLog.complaint?.address}</span>
          </div>
          {workLog.qualityScore && (
            <div className="flex items-center space-x-1">
              <FiStar className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-gray-700">{workLog.qualityScore}/5</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="ml-6 flex flex-col items-end space-y-2">
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg">
          <FiEye className="h-4 w-4 mr-2" />
          Review
        </button>
        <div className="text-xs text-gray-500">
          {new Date(workLog.submittedAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  </motion.div>
);
// Comprehensive Work Log Review Modal Component
const ComprehensiveWorkLogReviewModal = ({ workLog, onClose, onReview }) => {
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [qualityScore, setQualityScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

  const openImageModal = (image) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  };

  const formatDuration = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <FiShield className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Comprehensive Work Review</h2>
                  <p className="text-blue-100 mt-1">{workLog.complaint?.title}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      ID: {workLog.sessionId?.slice(-8)}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {workLog.fieldStaff?.name}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {workLog.durationFormatted}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-2xl transition-all duration-200"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mt-6 bg-white/10 p-1 rounded-2xl backdrop-blur-sm">
              {[
                { id: 'overview', label: 'Overview', icon: FiInfo },
                { id: 'timeline', label: 'Timeline', icon: FiClock },
                { id: 'location', label: 'Location', icon: FiMapPin },
                { id: 'progress', label: 'Progress', icon: FiActivity },
                { id: 'completion', label: 'Completion', icon: FiCheckCircle },
                { id: 'review', label: 'Review', icon: FiAward }
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-lg'
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
              {activeTab === 'overview' && (
                <OverviewTab key="overview" workLog={workLog} />
              )}
              {activeTab === 'timeline' && (
                <TimelineTab key="timeline" workLog={workLog} />
              )}
              {activeTab === 'location' && (
                <LocationTab key="location" workLog={workLog} />
              )}
              {activeTab === 'progress' && (
                <ProgressTab key="progress" workLog={workLog} openImageModal={openImageModal} />
              )}
              {activeTab === 'completion' && (
                <CompletionTab key="completion" workLog={workLog} openImageModal={openImageModal} />
              )}
              {activeTab === 'review' && (
                <ReviewTab
                  key="review"
                  workLog={workLog}
                  reviewStatus={reviewStatus}
                  setReviewStatus={setReviewStatus}
                  reviewNotes={reviewNotes}
                  setReviewNotes={setReviewNotes}
                  qualityScore={qualityScore}
                  setQualityScore={setQualityScore}
                  onSubmit={handleSubmitReview}
                  isSubmitting={isSubmitting}
                  onClose={onClose}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {isImageModalOpen && selectedImage && (
          <ImageModal
            image={selectedImage}
            onClose={() => {
              setIsImageModalOpen(false);
              setSelectedImage(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Overview Tab Component
const OverviewTab = ({ workLog }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Work Summary */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
            <FiFileText className="h-6 w-6 mr-3" />
            Work Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Session ID</p>
              <p className="font-bold text-gray-900">{workLog.sessionId?.slice(-12)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-bold text-gray-900 capitalize">{workLog.status}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="font-bold text-gray-900">{workLog.durationFormatted}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Distance</p>
              <p className="font-bold text-gray-900">{workLog.distanceFromComplaint}m</p>
            </div>
          </div>
        </div>

        {/* Complaint Details */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
            <FiFlag className="h-6 w-6 mr-3" />
            Complaint Details
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-2">{workLog.complaint?.title}</h4>
            <p className="text-gray-700 mb-4">{workLog.complaint?.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Category</p>
                <p className="font-semibold">{workLog.complaint?.category}</p>
              </div>
              <div>
                <p className="text-gray-600">Priority</p>
                <p className="font-semibold capitalize">{workLog.complaint?.priority}</p>
              </div>
              <div>
                <p className="text-gray-600">Citizen</p>
                <p className="font-semibold">{workLog.complaint?.citizen?.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Address</p>
                <p className="font-semibold">{workLog.complaint?.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Staff Info */}
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
            <FiUser className="h-6 w-6 mr-3" />
            Field Staff
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiUser className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900">{workLog.fieldStaff?.name}</h4>
              <p className="text-gray-600">{workLog.fieldStaff?.department}</p>
              <p className="text-sm text-gray-500">{workLog.fieldStaff?.email}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
            <FiBarChart2 className="h-6 w-6 mr-3" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-gray-600">Progress Updates</span>
              <span className="font-bold text-gray-900">{workLog.progressUpdates?.length || 0}</span>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-gray-600">Completion Images</span>
              <span className="font-bold text-gray-900">{workLog.completionImages?.length || 0}</span>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-gray-600">Pause/Resume Logs</span>
              <span className="font-bold text-gray-900">{workLog.pauseResumeLogs?.length || 0}</span>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-gray-600">Location Valid</span>
              <span className={`font-bold ${workLog.isValidStartLocation ? 'text-green-600' : 'text-red-600'}`}>
                {workLog.isValidStartLocation ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);
// Timeline Tab Component
const TimelineTab = ({ workLog }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Work Session Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
        
        <div className="space-y-8">
          {/* Start Event */}
          <div className="relative flex items-start">
            <div className="absolute left-6 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
            <div className="ml-16 bg-white rounded-xl p-6 shadow-lg border border-gray-200 flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-green-700 flex items-center">
                  <FiPlay className="h-5 w-5 mr-2" />
                  Work Started
                </h4>
                <span className="text-sm text-gray-500">{new Date(workLog.startTime).toLocaleString()}</span>
              </div>
              <p className="text-gray-600">Field staff began work at the complaint location</p>
              <div className="mt-3 text-sm text-gray-500">
                <p>Distance from complaint: {workLog.distanceFromComplaint}m</p>
                <p>Location valid: {workLog.isValidStartLocation ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Pause/Resume Events */}
          {workLog.pauseResumeLogs?.map((log, index) => (
            <div key={index} className="relative flex items-start">
              <div className={`absolute left-6 w-4 h-4 rounded-full border-4 border-white shadow-lg ${
                log.action === 'pause' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>
              <div className="ml-16 bg-white rounded-xl p-6 shadow-lg border border-gray-200 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold flex items-center ${
                    log.action === 'pause' ? 'text-yellow-700' : 'text-blue-700'
                  }`}>
                    {log.action === 'pause' ? <FiPause className="h-5 w-5 mr-2" /> : <FiPlay className="h-5 w-5 mr-2" />}
                    Work {log.action === 'pause' ? 'Paused' : 'Resumed'}
                  </h4>
                  <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                {log.reason && <p className="text-gray-600 mb-2">Reason: {log.reason}</p>}
                {log.notes && <p className="text-gray-600">Notes: {log.notes}</p>}
              </div>
            </div>
          ))}

          {/* Progress Updates */}
          {workLog.progressUpdates?.map((update, index) => (
            <div key={index} className="relative flex items-start">
              <div className="absolute left-6 w-4 h-4 bg-purple-500 rounded-full border-4 border-white shadow-lg"></div>
              <div className="ml-16 bg-white rounded-xl p-6 shadow-lg border border-gray-200 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-purple-700 flex items-center">
                    <FiActivity className="h-5 w-5 mr-2" />
                    Progress Update #{index + 1}
                  </h4>
                  <span className="text-sm text-gray-500">{new Date(update.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-gray-600 mb-2">{update.description}</p>
                {update.images && update.images.length > 0 && (
                  <p className="text-sm text-purple-600">📷 {update.images.length} image(s) attached</p>
                )}
              </div>
            </div>
          ))}

          {/* Completion Event */}
          {workLog.endTime && (
            <div className="relative flex items-start">
              <div className="absolute left-6 w-4 h-4 bg-green-600 rounded-full border-4 border-white shadow-lg"></div>
              <div className="ml-16 bg-white rounded-xl p-6 shadow-lg border border-gray-200 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-green-700 flex items-center">
                    <FiCheckCircle className="h-5 w-5 mr-2" />
                    Work Completed
                  </h4>
                  <span className="text-sm text-gray-500">{new Date(workLog.endTime).toLocaleString()}</span>
                </div>
                <p className="text-gray-600 mb-2">{workLog.completionNotes}</p>
                {workLog.completionImages && workLog.completionImages.length > 0 && (
                  <p className="text-sm text-green-600">📷 {workLog.completionImages.length} completion image(s)</p>
                )}
              </div>
            </div>
          )}

          {/* Submission Event */}
          {workLog.submittedAt && (
            <div className="relative flex items-start">
              <div className="absolute left-6 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
              <div className="ml-16 bg-white rounded-xl p-6 shadow-lg border border-gray-200 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-blue-700 flex items-center">
                    <FiTarget className="h-5 w-5 mr-2" />
                    Submitted for Review
                  </h4>
                  <span className="text-sm text-gray-500">{new Date(workLog.submittedAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-600">Work submitted to admin for review and approval</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);
// Location Tab Component
const LocationTab = ({ workLog }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Location Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Start Location */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center">
            <FiNavigation className="h-6 w-6 mr-3" />
            Start Location
          </h4>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Latitude</p>
                <p className="font-bold text-gray-900">{workLog.startLocation?.coordinates[1]?.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Longitude</p>
                <p className="font-bold text-gray-900">{workLog.startLocation?.coordinates[0]?.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                <p className="font-bold text-gray-900">±{workLog.startLocation?.accuracy}m</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Distance</p>
                <p className="font-bold text-gray-900">{workLog.distanceFromComplaint}m</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Validation Status</p>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                workLog.isValidStartLocation 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {workLog.isValidStartLocation ? '✅ Valid Location' : '❌ Invalid Location'}
              </span>
            </div>
            {workLog.startLocation?.address && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <p className="text-gray-700">{workLog.startLocation.address}</p>
              </div>
            )}
            <button
              onClick={() => {
                const [lng, lat] = workLog.startLocation.coordinates;
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
              }}
              className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <FiExternalLink className="h-4 w-4 mr-2" />
              View on Maps
            </button>
          </div>
        </div>

        {/* End Location */}
        {workLog.endLocation && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
              <FiTarget className="h-6 w-6 mr-3" />
              End Location
            </h4>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Latitude</p>
                  <p className="font-bold text-gray-900">{workLog.endLocation.coordinates[1]?.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Longitude</p>
                  <p className="font-bold text-gray-900">{workLog.endLocation.coordinates[0]?.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                  <p className="font-bold text-gray-900">±{workLog.endLocation.accuracy}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Movement</p>
                  <p className="font-bold text-gray-900">
                    {Math.round(
                      Math.sqrt(
                        Math.pow(workLog.endLocation.coordinates[0] - workLog.startLocation.coordinates[0], 2) +
                        Math.pow(workLog.endLocation.coordinates[1] - workLog.startLocation.coordinates[1], 2)
                      ) * 111000
                    )}m
                  </p>
                </div>
              </div>
              {workLog.endLocation.address && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="text-gray-700">{workLog.endLocation.address}</p>
                </div>
              )}
              <button
                onClick={() => {
                  const [lng, lat] = workLog.endLocation.coordinates;
                  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <FiExternalLink className="h-4 w-4 mr-2" />
                View on Maps
              </button>
            </div>
          </div>
        )}

        {/* Complaint Location */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h4 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
            <FiMapPin className="h-6 w-6 mr-3" />
            Complaint Location
          </h4>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Latitude</p>
                <p className="font-bold text-gray-900">{workLog.complaint?.location?.coordinates[1]?.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Longitude</p>
                <p className="font-bold text-gray-900">{workLog.complaint?.location?.coordinates[0]?.toFixed(6)}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Address</p>
              <p className="text-gray-700">{workLog.complaint?.address}</p>
            </div>
            <button
              onClick={() => {
                const [lng, lat] = workLog.complaint.location.coordinates;
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
              }}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <FiExternalLink className="h-4 w-4 mr-2" />
              View on Maps
            </button>
          </div>
        </div>

        {/* Location Summary */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
            <FiInfo className="h-6 w-6 mr-3" />
            Location Summary
          </h4>
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Work Area Compliance</span>
              <span className={`font-bold ${workLog.isValidStartLocation ? 'text-green-600' : 'text-red-600'}`}>
                {workLog.isValidStartLocation ? 'Compliant' : 'Non-Compliant'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Distance from Site</span>
              <span className="font-bold text-gray-900">{workLog.distanceFromComplaint}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Max Allowed Distance</span>
              <span className="font-bold text-gray-900">150m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">GPS Accuracy</span>
              <span className="font-bold text-gray-900">±{workLog.startLocation?.accuracy}m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);
// Progress Tab Component
const ProgressTab = ({ workLog, openImageModal }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Progress Updates</h3>
      
      {workLog.progressUpdates && workLog.progressUpdates.length > 0 ? (
        <div className="space-y-6">
          {workLog.progressUpdates.map((update, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-purple-900 flex items-center">
                    <FiActivity className="h-6 w-6 mr-3" />
                    Progress Update #{index + 1}
                  </h4>
                  <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                  <p className="text-gray-700 leading-relaxed">{update.description}</p>
                </div>
                
                {update.location && (
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-900 mb-2">Location Data</h5>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Latitude</p>
                          <p className="font-semibold">{update.location.coordinates[1]?.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Longitude</p>
                          <p className="font-semibold">{update.location.coordinates[0]?.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Accuracy</p>
                          <p className="font-semibold">±{update.location.accuracy}m</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {update.images && update.images.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-4">Attached Images ({update.images.length})</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {update.images.map((image, imgIndex) => (
                        <div key={imgIndex} className="relative group cursor-pointer" onClick={() => openImageModal(image)}>
                          <img
                            src={image.url}
                            alt={`Progress ${index + 1} - Image ${imgIndex + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-sm group-hover:shadow-lg transition-shadow"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-200 flex items-center justify-center">
                            <FiZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {image.originalName || `Image ${imgIndex + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FiActivity className="mx-auto h-16 w-16 text-gray-300" />
          <h4 className="mt-4 text-lg font-semibold text-gray-900">No Progress Updates</h4>
          <p className="mt-2 text-gray-500">No progress updates were recorded during this work session</p>
        </div>
      )}
    </div>
  </motion.div>
);

// Completion Tab Component
const CompletionTab = ({ workLog, openImageModal }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Work Completion</h3>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
          <h4 className="text-xl font-bold text-green-900 flex items-center">
            <FiCheckCircle className="h-6 w-6 mr-3" />
            Completion Details
          </h4>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <h5 className="font-semibold text-gray-900 mb-4">Completion Notes</h5>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed">{workLog.completionNotes}</p>
            </div>
          </div>
          
          {workLog.completionImages && workLog.completionImages.length > 0 && (
            <div className="mb-8">
              <h5 className="font-semibold text-gray-900 mb-4">
                Completion Images ({workLog.completionImages.length})
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {workLog.completionImages.map((image, index) => (
                  <div key={index} className="relative group cursor-pointer" onClick={() => openImageModal(image)}>
                    <img
                      src={image.url}
                      alt={`Completion Image ${index + 1}`}
                      className="w-full h-40 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-200 flex items-center justify-center">
                      <FiZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 text-white text-xs px-3 py-1 rounded-full">
                      {image.originalName || `Image ${index + 1}`}
                    </div>
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Final
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {workLog.endLocation && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">Completion Location</h5>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Latitude</p>
                    <p className="font-semibold">{workLog.endLocation.coordinates[1]?.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Longitude</p>
                    <p className="font-semibold">{workLog.endLocation.coordinates[0]?.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Accuracy</p>
                    <p className="font-semibold">±{workLog.endLocation.accuracy}m</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Completed At</p>
                    <p className="font-semibold">{new Date(workLog.endTime).toLocaleTimeString()}</p>
                  </div>
                </div>
                {workLog.endLocation.address && (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-1">Address</p>
                    <p className="text-gray-700">{workLog.endLocation.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);
// Review Tab Component
const ReviewTab = ({ 
  workLog, 
  reviewStatus, 
  setReviewStatus, 
  reviewNotes, 
  setReviewNotes, 
  qualityScore, 
  setQualityScore, 
  onSubmit, 
  isSubmitting, 
  onClose 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Admin Review & Approval</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Review Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiAward className="h-6 w-6 mr-3 text-blue-600" />
              Review Decision
            </h4>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Review Status
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'approved', label: 'Approve Work', color: 'green', icon: FiCheckCircle },
                    { value: 'rejected', label: 'Reject Work', color: 'red', icon: FiXCircle },
                    { value: 'needs_revision', label: 'Needs Revision', color: 'orange', icon: FiEdit3 }
                  ].map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setReviewStatus(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          reviewStatus === option.value
                            ? `border-${option.color}-500 bg-${option.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <OptionIcon className={`h-6 w-6 mx-auto mb-2 ${
                          reviewStatus === option.value ? `text-${option.color}-600` : 'text-gray-400'
                        }`} />
                        <p className={`text-sm font-medium ${
                          reviewStatus === option.value ? `text-${option.color}-900` : 'text-gray-600'
                        }`}>
                          {option.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Quality Score (1-5 Stars)
                </label>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => setQualityScore(score)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        qualityScore >= score
                          ? 'text-yellow-500 bg-yellow-50 scale-110 shadow-lg'
                          : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'
                      }`}
                    >
                      <FiStar className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {qualityScore}/5 Stars
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {qualityScore === 5 ? 'Excellent' : 
                     qualityScore === 4 ? 'Good' : 
                     qualityScore === 3 ? 'Average' : 
                     qualityScore === 2 ? 'Below Average' : 'Poor'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Review Notes {reviewStatus === 'rejected' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide detailed feedback on work quality, completeness, adherence to procedures, and any recommendations..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting || (reviewStatus === 'rejected' && !reviewNotes.trim())}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
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
                      Processing...
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
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Review Summary */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-blue-900 mb-4">Work Summary</h4>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-600 text-sm">Duration</span>
                <span className="font-bold text-gray-900">{workLog.durationFormatted}</span>
              </div>
              <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-600 text-sm">Updates</span>
                <span className="font-bold text-gray-900">{workLog.progressUpdates?.length || 0}</span>
              </div>
              <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-600 text-sm">Images</span>
                <span className="font-bold text-gray-900">{workLog.completionImages?.length || 0}</span>
              </div>
              <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-600 text-sm">Location Valid</span>
                <span className={`font-bold ${workLog.isValidStartLocation ? 'text-green-600' : 'text-red-600'}`}>
                  {workLog.isValidStartLocation ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <h4 className="text-lg font-bold text-purple-900 mb-4">Review Guidelines</h4>
            <div className="space-y-2 text-sm text-purple-700">
              <p>• Check location compliance (150m radius)</p>
              <p>• Verify completion images quality</p>
              <p>• Review progress documentation</p>
              <p>• Assess work duration reasonableness</p>
              <p>• Validate completion notes detail</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Image Modal Component
const ImageModal = ({ image, onClose }) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative max-w-4xl max-h-[90vh] w-full"
    >
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={() => window.open(image.url, '_blank')}
          className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <FiExternalLink className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <img
        src={image.url}
        alt={image.originalName || 'Work Image'}
        className="w-full h-full object-contain rounded-2xl"
      />
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full">
        {image.originalName || 'Work Image'}
      </div>
    </motion.div>
  </div>
);

export default ComprehensiveAdminWorkReview;