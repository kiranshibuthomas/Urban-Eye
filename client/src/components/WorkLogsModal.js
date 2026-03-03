import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiClock,
  FiMapPin,
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiCalendar,
  FiBarChart3,
  FiDownload,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const WorkLogsModal = ({ isOpen, onClose }) => {
  const [workLogs, setWorkLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Fetch work logs
  const fetchWorkLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.append('endDate', dateFilter.endDate);

      const response = await fetch(`/api/field-staff/work-logs?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkLogs(data.workLogs);
          setSummary(data.summary);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Failed to fetch work logs');
      }
    } catch (error) {
      console.error('Work logs fetch error:', error);
      toast.error('Failed to load work logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Load work logs when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkLogs();
    }
  }, [isOpen, dateFilter]);

  // Format duration
  const formatDuration = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      work_completed: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get task status info
  const getTaskStatusInfo = (status) => {
    const statusInfo = {
      not_started: { icon: FiPlay, color: 'text-gray-500', text: 'Not Started' },
      checked_in: { icon: FiMapPin, color: 'text-blue-500', text: 'Checked In' },
      in_progress: { icon: FiPlay, color: 'text-green-500', text: 'In Progress' },
      paused: { icon: FiPause, color: 'text-yellow-500', text: 'Paused' },
      checked_out: { icon: FiCheckCircle, color: 'text-gray-500', text: 'Checked Out' },
      completed: { icon: FiCheckCircle, color: 'text-green-600', text: 'Completed' }
    };
    return statusInfo[status] || statusInfo.not_started;
  };

  if (!isOpen) return null;

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
              <h2 className="text-2xl font-bold text-gray-900">Work Logs & Analytics</h2>
              <p className="text-gray-600 mt-1">Detailed tracking of your field work activities</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <FiCalendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                placeholder="Start date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                placeholder="End date"
              />
            </div>
            <button
              onClick={fetchWorkLogs}
              disabled={isLoading}
              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isLoading ? (
                <FiRefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FiFilter className="h-4 w-4 mr-1" />
              )}
              {isLoading ? 'Loading...' : 'Filter'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <FiBarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Total Complaints</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalComplaints || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FiMapPin className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Total Check-ins</p>
                  <p className="text-2xl font-bold text-green-600">{summary.totalCheckIns || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FiPause className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Total Pauses</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.totalPauses || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <FiClock className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Total Work Hours</p>
                  <p className="text-2xl font-bold text-purple-600">{formatDuration(summary.totalWorkHours || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Work Logs List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FiRefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
              <span className="text-gray-600">Loading work logs...</span>
            </div>
          ) : workLogs.length > 0 ? (
            <div className="space-y-4">
              {workLogs.map((log) => {
                const taskStatus = getTaskStatusInfo(log.currentTaskStatus);
                const TaskStatusIcon = taskStatus.icon;
                
                return (
                  <div
                    key={log.complaintId}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{log.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status.replace('_', ' ')}
                          </span>
                          <div className={`flex items-center text-sm ${taskStatus.color}`}>
                            <TaskStatusIcon className="h-4 w-4 mr-1" />
                            {taskStatus.text}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium">Assigned</p>
                            <p>{new Date(log.assignedAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="font-medium">Check-ins</p>
                            <p>{log.totalCheckIns}</p>
                          </div>
                          <div>
                            <p className="font-medium">Pauses</p>
                            <p>{log.totalPauses}</p>
                          </div>
                          <div>
                            <p className="font-medium">Work Time</p>
                            <p>{formatDuration(log.totalWorkTimeHours)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedComplaint(selectedComplaint === log.complaintId ? null : log.complaintId)}
                        className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        {selectedComplaint === log.complaintId ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>

                    {/* Detailed View */}
                    <AnimatePresence>
                      {selectedComplaint === log.complaintId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Check-ins */}
                            {log.checkIns.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <FiMapPin className="h-4 w-4 mr-2" />
                                  Check-in History
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {log.checkIns.map((checkIn, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">
                                          {new Date(checkIn.checkInTime).toLocaleString()}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                          checkIn.isValidLocation 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {checkIn.isValidLocation ? 'Valid' : `${Math.round(checkIn.distanceFromComplaint)}m away`}
                                        </span>
                                      </div>
                                      {checkIn.checkOutTime && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          Checked out: {new Date(checkIn.checkOutTime).toLocaleString()}
                                        </p>
                                      )}
                                      {checkIn.notes && (
                                        <p className="text-xs text-gray-700 mt-2 bg-white rounded p-2">
                                          {checkIn.notes}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Pauses */}
                            {log.pauses.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <FiPause className="h-4 w-4 mr-2" />
                                  Pause History
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {log.pauses.map((pause, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">
                                          {new Date(pause.pausedAt).toLocaleString()}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                          pause.resumedAt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {pause.resumedAt ? 'Resumed' : 'Active'}
                                        </span>
                                      </div>
                                      {pause.resumedAt && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          Resumed: {new Date(pause.resumedAt).toLocaleString()}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-700 mt-2 bg-white rounded p-2">
                                        <strong>Reason:</strong> {pause.reason}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No work logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {dateFilter.startDate || dateFilter.endDate
                  ? 'Try adjusting your date filters'
                  : 'Start working on complaints to see your work logs here'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WorkLogsModal;