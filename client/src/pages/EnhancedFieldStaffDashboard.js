import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EnhancedFieldStaffWorkflow from '../components/EnhancedFieldStaffWorkflow';
import ModernStatCard from '../components/ModernStatCard';
import LocationTracker from '../components/LocationTracker';
import WorkLogsModal from '../components/WorkLogsModal';
import {
  FiHome,
  FiMenu,
  FiLogOut,
  FiUser,
  FiSettings,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiFilter,
  FiSearch,
  FiMoreVertical,
  FiEye,
  FiRefreshCw,
  FiActivity,
  FiTarget,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiBarChart3,
  FiX,
  FiBell,
  FiGrid,
  FiList,
  FiChevronDown,
  FiZap,
  FiShield,
  FiMessageSquare,
  FiNavigation,
  FiPlay,
  FiPause,
  FiSquare,
  FiInfo,
  FiTool,
  FiAward,
  FiTrendingDown,
  FiWifi,
  FiWifiOff,
  FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const EnhancedFieldStaffDashboard = () => {
  const { user, logout } = useAuth();
  const { extendSession } = useSession();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showWorkLogs, setShowWorkLogs] = useState(false);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle location update from LocationTracker
  const handleLocationUpdate = useCallback((location) => {
    setCurrentLocation(location);
    setLocationError(null);
    
    // Update server with current location
    updateServerLocation(location);
  }, []);

  // Update server with current location
  const updateServerLocation = async (location) => {
    try {
      await fetch('/api/field-staff/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude
        })
      });
    } catch (error) {
      console.error('Failed to update server location:', error);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/field-staff/dashboard', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.dashboard);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await fetch(`/api/field-staff/complaints?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComplaints(data.complaints);
        }
      }
    } catch (error) {
      console.error('Complaints fetch error:', error);
      toast.error('Failed to load complaints');
    }
  }, [statusFilter, priorityFilter]);

  // Filter complaints based on search query
  const filteredComplaints = useMemo(() => {
    if (!searchQuery.trim()) return complaints;
    
    return complaints.filter(complaint =>
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [complaints, searchQuery]);

  // Handle complaint selection
  const handleComplaintSelect = (complaint) => {
    setSelectedComplaint(complaint);
    setIsWorkflowModalOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = async (complaintId, status, notes) => {
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaintId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Refresh data
        await fetchComplaints();
        await fetchDashboardData();
        return data;
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      throw error;
    }
  };

  // Handle work completion
  const handleWorkComplete = async (complaintId, completionNotes, proofImages) => {
    try {
      const formData = new FormData();
      formData.append('completionNotes', completionNotes);
      
      proofImages.forEach((image, index) => {
        formData.append('proofImages', image);
      });

      const response = await fetch(`/api/field-staff/complaints/${complaintId}/complete-work`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Refresh data
        await fetchComplaints();
        await fetchDashboardData();
        setIsWorkflowModalOpen(false);
        return data;
      } else {
        throw new Error(data.message || 'Failed to complete work');
      }
    } catch (error) {
      console.error('Work completion error:', error);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Initialize dashboard
  useEffect(() => {
    fetchDashboardData();
    fetchComplaints();
    
    return () => {
      // Cleanup any intervals if needed
    };
  }, [fetchDashboardData, fetchComplaints]);

  // Refresh complaints when filters change
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) {
        fetchDashboardData();
        fetchComplaints();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchComplaints, isOnline]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const fieldStaff = dashboardData?.fieldStaff || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Field Staff Dashboard</h1>
              </div>
              
              {/* Network Status */}
              <div className="ml-4 flex items-center">
                {isOnline ? (
                  <div className="flex items-center text-green-600">
                    <FiWifi className="h-4 w-4 mr-1" />
                    <span className="text-xs">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <FiWifiOff className="h-4 w-4 mr-1" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>

              {/* Location Tracker */}
              <LocationTracker
                onLocationUpdate={handleLocationUpdate}
                autoUpdate={true}
                updateInterval={300000} // 5 minutes
                className="ml-4"
              />
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Work Logs button */}
              <button
                onClick={() => setShowWorkLogs(true)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="View work logs"
              >
                <FiFileText className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Work Logs</span>
              </button>

              {/* Refresh button */}
              <button
                onClick={() => {
                  fetchDashboardData();
                  fetchComplaints();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {fieldStaff.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-gray-900">{fieldStaff.name}</p>
                      <p className="text-xs text-gray-500">{fieldStaff.department}</p>
                    </div>
                    <FiChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => navigate('/profile')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <FiUser className="mr-3 h-4 w-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => navigate('/settings')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <FiSettings className="mr-3 h-4 w-4" />
                          Settings
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                        >
                          <FiLogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ModernStatCard
            title="Total Assigned"
            value={stats.totalAssigned || 0}
            icon={FiClipboard}
            color="blue"
            trend={null}
          />
          <ModernStatCard
            title="In Progress"
            value={stats.inProgress || 0}
            icon={FiActivity}
            color="orange"
            trend={null}
          />
          <ModernStatCard
            title="Work Completed"
            value={stats.workCompleted || 0}
            icon={FiCheckCircle}
            color="purple"
            trend={null}
          />
          <ModernStatCard
            title="Resolved"
            value={stats.resolved || 0}
            icon={FiTarget}
            color="green"
            trend={null}
          />
        </div>

        {/* Location Error Alert */}
        {locationError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Location Error</h3>
                <p className="text-sm text-red-700 mt-1">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="work_completed">Work Completed</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <FiGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <FiList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints Grid/List */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint._id}
              complaint={complaint}
              viewMode={viewMode}
              onSelect={handleComplaintSelect}
              currentLocation={currentLocation}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <FiClipboard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No complaints have been assigned to you yet'}
            </p>
          </div>
        )}
      </main>

      {/* Work Logs Modal */}
      <AnimatePresence>
        {showWorkLogs && (
          <WorkLogsModal
            isOpen={showWorkLogs}
            onClose={() => setShowWorkLogs(false)}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Workflow Modal */}
      <AnimatePresence>
        {isWorkflowModalOpen && selectedComplaint && (
          <EnhancedFieldStaffWorkflow
            complaint={selectedComplaint}
            onStatusUpdate={handleStatusUpdate}
            onWorkComplete={handleWorkComplete}
            onClose={() => {
              setIsWorkflowModalOpen(false);
              setSelectedComplaint(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Complaint Card Component
const ComplaintCard = ({ complaint, viewMode, onSelect, currentLocation }) => {
  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      work_completed: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800'
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const getDistanceFromComplaint = () => {
    if (!currentLocation || !complaint.location?.coordinates) return null;
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      complaint.location.coordinates[1],
      complaint.location.coordinates[0]
    );
    
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    } else {
      return `${(distance / 1000).toFixed(1)}km away`;
    }
  };

  const getTaskStatusInfo = () => {
    const status = complaint.currentTaskStatus || 'not_started';
    const statusInfo = {
      not_started: { icon: FiPlay, color: 'text-gray-500', text: 'Not Started' },
      checked_in: { icon: FiMapPin, color: 'text-blue-500', text: 'Checked In' },
      in_progress: { icon: FiActivity, color: 'text-green-500', text: 'In Progress' },
      paused: { icon: FiPause, color: 'text-yellow-500', text: 'Paused' },
      checked_out: { icon: FiSquare, color: 'text-gray-500', text: 'Checked Out' },
      completed: { icon: FiCheckCircle, color: 'text-green-600', text: 'Completed' }
    };
    return statusInfo[status] || statusInfo.not_started;
  };

  const taskStatus = getTaskStatusInfo();
  const TaskStatusIcon = taskStatus.icon;

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelect(complaint)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{complaint.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FiMapPin className="h-4 w-4 mr-1" />
                    {complaint.address}
                  </span>
                  {currentLocation && (
                    <span className="flex items-center">
                      <FiNavigation className="h-4 w-4 mr-1" />
                      {getDistanceFromComplaint()}
                    </span>
                  )}
                  <span className="flex items-center">
                    <FiCalendar className="h-4 w-4 mr-1" />
                    {new Date(complaint.fieldStaffAssignedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                </div>
                <div className={`flex items-center text-sm ${taskStatus.color}`}>
                  <TaskStatusIcon className="h-4 w-4 mr-1" />
                  {taskStatus.text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(complaint)}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{complaint.title}</h3>
          <div className="flex items-center space-x-1 ml-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{complaint.description}</p>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <FiMapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">{complaint.address}</span>
        </div>

        {currentLocation && (
          <div className="flex items-center text-sm text-blue-600 mb-3">
            <FiNavigation className="h-4 w-4 mr-1" />
            <span>{getDistanceFromComplaint()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace('_', ' ')}
            </span>
            <div className={`flex items-center text-sm ${taskStatus.color}`}>
              <TaskStatusIcon className="h-4 w-4 mr-1" />
              {taskStatus.text}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(complaint.fieldStaffAssignedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedFieldStaffDashboard;