import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiArchive,
  FiUser,
  FiCalendar,
  FiMessageSquare
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingLog, setDeletingLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/complaints/audit-logs?limit=100', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        toast.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (logId) => {
    try {
      setDeletingLog(logId);
      const response = await fetch(`/api/complaints/audit-logs/${logId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Log deleted successfully');
        setLogs(logs.filter(log => log._id !== logId));
      } else {
        toast.error(data.message || 'Failed to delete log');
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    } finally {
      setDeletingLog(null);
    }
  };

  const clearAllLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/complaints/audit-logs', {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('All logs cleared successfully');
        setLogs([]);
      } else {
        toast.error(data.message || 'Failed to clear logs');
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear logs');
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'hard_delete':
        return <FiXCircle className="h-4 w-4 text-red-600" />;
      case 'archive':
        return <FiArchive className="h-4 w-4 text-orange-600" />;
      case 'restore':
        return <FiCheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <FiMessageSquare className="h-4 w-4 text-blue-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'hard_delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'archive':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'restore':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Log</h1>
                <p className="text-gray-600">Complaint management audit trail</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchLogs}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              {logs.length > 0 && (
                <button
                  onClick={clearAllLogs}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <FiTrash2 className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <FiXCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Permanently Deleted</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter(log => log.action === 'hard_delete').length}
                </p>
                <p className="text-xs text-gray-500">Cannot be recovered</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiArchive className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-orange-600">
                  {logs.filter(log => log.action === 'archive').length}
                </p>
                <p className="text-xs text-gray-500">Can be restored</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Restored</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(log => log.action === 'restore').length}
                </p>
                <p className="text-xs text-gray-500">Brought back to active</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Log Entries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Log Entries</h2>
            <p className="text-sm text-gray-500 mt-1">Traditional log format - one entry per line</p>
          </div>

          <div className="divide-y divide-gray-200 max-h-[calc(100vh-400px)] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <FiAlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                <p className="text-gray-600">No admin actions have been recorded yet.</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="px-6 py-3 hover:bg-gray-50 transition-colors duration-200 border-l-2 border-transparent hover:border-gray-300 font-mono text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* Timestamp */}
                      <span className="text-gray-500 text-xs font-medium whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>

                      {/* Action */}
                      <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                        log.action === 'hard_delete' ? 'bg-red-100 text-red-800' :
                        log.action === 'archive' ? 'bg-orange-100 text-orange-800' :
                        log.action === 'restore' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action === 'hard_delete' ? 'DELETE' : 
                         log.action === 'archive' ? 'ARCHIVE' : 
                         log.action === 'restore' ? 'RESTORE' : 
                         'UPDATE'}
                      </span>

                      {/* Complaint Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-900 font-medium">
                          "{log.details?.complaintTitle || 'Unknown Complaint'}"
                        </span>
                        <span className="text-gray-500 ml-2">
                          by {log.details?.citizenName || 'Unknown'}
                        </span>
                        <span className="text-gray-400 ml-2">
                          [{log.details?.complaintCategory?.replace('_', ' ') || 'Unknown'}]
                        </span>
                      </div>

                      {/* Admin */}
                      <span className="text-gray-600 whitespace-nowrap">
                        admin:{log.performedBy?.name || log.performedByEmail || 'Unknown'}
                      </span>

                      {/* Reason (if exists) */}
                      {log.reason && (
                        <span className="text-gray-500 italic max-w-xs truncate">
                          reason: "{log.reason}"
                        </span>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteLog(log._id)}
                      disabled={deletingLog === log._id}
                      className="ml-4 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 disabled:opacity-50"
                      title="Delete this log entry"
                    >
                      {deletingLog === log._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <FiTrash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
