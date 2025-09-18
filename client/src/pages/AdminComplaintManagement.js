import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiEdit, 
  FiCheckCircle, 
  FiClock, 
  FiXCircle,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiAlertCircle,
  FiTrendingUp,
  FiBarChart2,
  FiMap,
  FiTrash2,
  FiThumbsDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import GoogleMapModal from '../components/GoogleMapModal';

const AdminComplaintManagement = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    deleted: 0
  });
  const [showMap, setShowMap] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteType, setDeleteType] = useState('archive'); // 'archive' or 'hard-delete'
  const [showDeleted, setShowDeleted] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [complaintToReject, setComplaintToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchComplaints();
    fetchStats();
    loadGoogleMapsScript();
  }, [filters, showDeleted]);

  // Smart background refresh - only when tab is active and user is idle
  useEffect(() => {
    let interval;
    let lastActivity = Date.now();
    
    const resetActivityTimer = () => {
      lastActivity = Date.now();
    };
    
    const checkAndRefresh = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      // Only refresh if:
      // 1. Tab is visible (user is on the page)
      // 2. User has been idle for at least 2 minutes
      // 3. No loading is in progress
      if (document.visibilityState === 'visible' && 
          timeSinceActivity > 120000 && 
          !loading) {
        fetchComplaints();
        fetchStats();
        lastActivity = now; // Reset activity timer after refresh
      }
    };
    
    // Set up activity tracking
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivityTimer, true);
    });
    
    // Check every 30 seconds
    interval = setInterval(checkAndRefresh, 30000);
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, resetActivityTimer, true);
      });
    };
  }, [loading]);

  const loadGoogleMapsScript = () => {
    if (window.google) return; // Already loaded

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  };

  const fetchComplaints = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.search) queryParams.append('search', filters.search);
      if (showDeleted) queryParams.append('status', 'deleted');

      const response = await fetch(`/api/complaints?${queryParams}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setComplaints(data.complaints);
      } else {
        toast.error('Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/complaints/stats/overview', {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        console.log('Stats received:', data.stats);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.message);
        toast.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Status updated successfully');
        fetchComplaints();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteComplaint = (complaint, type = 'archive') => {
    setComplaintToDelete(complaint);
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const confirmDeleteComplaint = async () => {
    if (!complaintToDelete) return;

    try {
      const endpoint = deleteType === 'hard-delete' 
        ? `/api/complaints/${complaintToDelete._id}/hard-delete`
        : `/api/complaints/${complaintToDelete._id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason: deleteReason })
      });

      const data = await response.json();

      if (data.success) {
        const message = deleteType === 'hard-delete' 
          ? 'Complaint permanently deleted'
          : 'Complaint archived successfully';
        toast.success(message);
        fetchComplaints();
        fetchStats();
      } else {
        const errorMessage = deleteType === 'hard-delete'
          ? 'Failed to permanently delete complaint'
          : 'Failed to archive complaint';
        toast.error(data.message || errorMessage);
      }
    } catch (error) {
      console.error(`Error ${deleteType} complaint:`, error);
      const errorMessage = deleteType === 'hard-delete'
        ? 'Failed to permanently delete complaint'
        : 'Failed to archive complaint';
      toast.error(errorMessage);
    } finally {
      setShowDeleteDialog(false);
      setComplaintToDelete(null);
      setDeleteReason('');
      setDeleteType('archive');
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setComplaintToDelete(null);
    setDeleteReason('');
    setDeleteType('archive');
  };

  const handleRestoreComplaint = async (complaint) => {
    try {
      const response = await fetch(`/api/complaints/${complaint._id}/restore`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Complaint restored successfully');
        fetchComplaints();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to restore complaint');
      }
    } catch (error) {
      console.error('Error restoring complaint:', error);
      toast.error('Failed to restore complaint');
    }
  };

  const handleRejectComplaint = (complaint) => {
    setComplaintToReject(complaint);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const confirmRejectComplaint = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch(`/api/complaints/${complaintToReject._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        })
      });

      if (response.ok) {
        toast.success('Complaint rejected successfully');
        setShowRejectDialog(false);
        setComplaintToReject(null);
        setRejectionReason('');
        fetchComplaints();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to reject complaint');
      }
    } catch (error) {
      console.error('Error rejecting complaint:', error);
      toast.error('Failed to reject complaint');
    }
  };

  const cancelReject = () => {
    setShowRejectDialog(false);
    setComplaintToReject(null);
    setRejectionReason('');
  };

  const handleViewMap = (complaint) => {
    setSelectedComplaint(complaint);
    setShowMap(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      road_issues: '🛣️',
      water_supply: '💧',
      electricity: '⚡',
      waste_management: '🗑️',
      public_transport: '🚌',
      parks_recreation: '🌳',
      street_lighting: '💡',
      drainage: '🌊',
      noise_pollution: '🔊',
      air_pollution: '🌫️',
      safety_security: '🛡️',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaint Management</h1>
          <p className="text-base text-gray-600">Manage and track all reported issues</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiBarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
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
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiAlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiXCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FiTrash2 className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-600">Archived</p>
                <p className="text-3xl font-bold text-gray-900">{stats.deleted || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">All Categories</option>
                <option value="road_issues">Road Issues</option>
                <option value="water_supply">Water Supply</option>
                <option value="electricity">Electricity</option>
                <option value="waste_management">Waste Management</option>
                <option value="public_transport">Public Transport</option>
                <option value="parks_recreation">Parks & Recreation</option>
                <option value="street_lighting">Street Lighting</option>
                <option value="drainage">Drainage</option>
                <option value="noise_pollution">Noise Pollution</option>
                <option value="air_pollution">Air Pollution</option>
                <option value="safety_security">Safety & Security</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-900">Admin Actions</h3>
              <p className="text-base text-gray-500">Manage complaints and view audit logs</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/audit-logs')}
                className="flex items-center px-4 py-2 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors duration-200"
              >
                <FiBarChart2 className="h-4 w-4 mr-2" />
                View Logs
              </button>
              <button
                onClick={() => {
                  setShowDeleted(!showDeleted);
                  setFilters(prev => ({ ...prev, status: '' })); // Clear status filter when toggling
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showDeleted ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showDeleted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-base text-gray-600">Show Archived</span>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Complaints ({complaints.length})</h2>
              <div className="flex items-center space-x-2 text-base text-gray-500">
                <span>Showing {complaints.length} results</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[calc(100vh-400px)] overflow-y-auto">
            {complaints.map((complaint, index) => (
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start mb-3">
                      <span className="text-2xl mr-3 flex-shrink-0">{getCategoryIcon(complaint.category)}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">{complaint.title}</h3>
                        <p className="text-base text-gray-600 mt-1 line-clamp-2">{complaint.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-base text-gray-500">
                      <div className="flex items-center">
                        <FiMapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{complaint.address}, {complaint.city}</span>
                      </div>
                      <div className="flex items-center">
                        <FiCalendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{formatDate(complaint.submittedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <FiUser className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{complaint.citizenName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigate(`/complaint/${complaint._id}`)}
                      className="flex items-center px-3 py-1.5 text-base text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      <FiEye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleViewMap(complaint)}
                          className="flex items-center px-3 py-1.5 text-base text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-200"
                    >
                      <FiMap className="h-4 w-4 mr-1" />
                      View Map
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {complaint.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateComplaintStatus(complaint._id, 'in_progress')}
                          className="flex items-center px-3 py-1.5 text-base text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                        >
                          <FiEdit className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Start Work</span>
                          <span className="sm:hidden">Start</span>
                        </button>
                        <button
                          onClick={() => handleRejectComplaint(complaint)}
                          className="flex items-center px-3 py-1.5 text-base text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors duration-200"
                          title="Reject complaint"
                        >
                          <FiThumbsDown className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </>
                    )}
                    {complaint.status === 'in_progress' && (
                      <button
                        onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                          className="flex items-center px-3 py-1.5 text-base text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-200"
                      >
                        <FiCheckCircle className="h-4 w-4 mr-1" />
                        Mark Resolved
                      </button>
                    )}
                    {complaint.status === 'deleted' ? (
                      <button
                        onClick={() => handleRestoreComplaint(complaint)}
                          className="flex items-center px-3 py-1.5 text-base text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-200"
                        title="Restore complaint"
                      >
                        <FiCheckCircle className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Restore</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteComplaint(complaint, 'archive')}
                          className="flex items-center px-3 py-1.5 text-base text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors duration-200"
                          title="Archive complaint (soft delete)"
                        >
                          <FiTrash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Archive</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComplaint(complaint, 'hard-delete')}
                          className="flex items-center px-3 py-1.5 text-base text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                          title="Permanently delete complaint"
                        >
                          <FiXCircle className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {complaints.length === 0 && (
            <div className="text-center py-12">
              <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          )}
        </div>

        {/* Google Maps Modal */}
        {showMap && selectedComplaint && (
          <GoogleMapModal
            isOpen={showMap}
            onClose={() => {
              setShowMap(false);
              setSelectedComplaint(null);
            }}
            latitude={selectedComplaint.location.coordinates[1]}
            longitude={selectedComplaint.location.coordinates[0]}
            address={`${selectedComplaint.address}, ${selectedComplaint.city}`}
            title={selectedComplaint.title}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && complaintToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`flex-shrink-0 w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    deleteType === 'hard-delete' ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    {deleteType === 'hard-delete' ? (
                      <FiXCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <FiTrash2 className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {deleteType === 'hard-delete' ? 'Permanently Delete Complaint' : 'Archive Complaint'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {deleteType === 'hard-delete' 
                      ? 'This will permanently delete the complaint and all associated data. This action cannot be undone.'
                      : 'This will archive the complaint. Users can still see it in their history but it won\'t appear in active lists.'
                    }
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-900">{complaintToDelete.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {complaintToDelete.category.replace('_', ' ')} • {complaintToDelete.priority} priority
                    </p>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for {deleteType === 'hard-delete' ? 'deleting' : 'archiving'} 
                      <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="deleteReason"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder={`Enter reason for ${deleteType === 'hard-delete' ? 'deleting' : 'archiving'} this complaint...`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {deleteReason.length}/500 characters
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteComplaint}
                    className={`flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      deleteType === 'hard-delete'
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                    }`}
                  >
                    {deleteType === 'hard-delete' ? 'Delete Permanently' : 'Archive'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {showRejectDialog && complaintToReject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Reject Complaint
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Please provide a reason for rejecting this complaint. The user will be notified via email.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectionReason.length}/500 characters
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelReject}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRejectComplaint}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
                  >
                    Reject Complaint
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaintManagement;

