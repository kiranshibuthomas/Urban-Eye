import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin,
  FiClock,
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiUser,
  FiLogOut,
  FiSettings,
  FiBarChart2,
  FiList,
  FiNavigation,
  FiActivity,
  FiTarget,
  FiEye,
  FiChevronRight,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import WorkSessionModal from '../components/WorkSessionModal';

const FieldStaffDashboardNew = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/field-work/dashboard', {
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
      setRefreshing(false);
    }
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Handle complaint selection
  const handleComplaintSelect = (complaint) => {
    setSelectedComplaint(complaint);
    setIsWorkModalOpen(true);
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
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (isOnline && !isWorkModalOpen) {
        fetchDashboardData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, isOnline, isWorkModalOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const { assignedComplaints, activeSession, stats, recentWork } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Field Work Dashboard</h1>
              
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
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <FiRefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.department}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Profile"
                  >
                    <FiUser className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <FiSettings className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <FiLogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Work Session Alert */}
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiActivity className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Active Work Session</h3>
                  <p className="text-sm text-blue-700">
                    Working on: {activeSession.complaint?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeSession.status === 'started' || activeSession.status === 'resumed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {activeSession.status === 'paused' ? 'Paused' : 'In Progress'}
                </span>
                <button
                  onClick={() => handleComplaintSelect(activeSession.complaint)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Continue Work
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Assigned Tasks"
            value={stats?.totalAssigned || 0}
            icon={FiList}
            color="blue"
          />
          <StatCard
            title="Completed This Month"
            value={stats?.completedThisMonth || 0}
            icon={FiCheckCircle}
            color="green"
          />
          <StatCard
            title="Total Work Hours"
            value={`${stats?.totalWorkHours || 0}h`}
            icon={FiClock}
            color="purple"
          />
          <StatCard
            title="Avg. Work Time"
            value={`${stats?.averageWorkTime || 0}m`}
            icon={FiBarChart2}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Complaints */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Assigned Complaints</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on any complaint to start or continue work
                </p>
              </div>
              <div className="p-6">
                {assignedComplaints && assignedComplaints.length > 0 ? (
                  <div className="space-y-4">
                    {assignedComplaints.map((complaint) => (
                      <ComplaintCard
                        key={complaint._id}
                        complaint={complaint}
                        onSelect={handleComplaintSelect}
                        isActive={activeSession?.complaint?._id === complaint._id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned complaints</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don't have any complaints assigned to you at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Work & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/field-work/history')}
                  className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FiClock className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Work History</span>
                  </div>
                  <FiChevronRight className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => navigate('/field-work/statistics')}
                  className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FiBarChart2 className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Performance Stats</span>
                  </div>
                  <FiChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Recent Work */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Work</h3>
              {recentWork && recentWork.length > 0 ? (
                <div className="space-y-3">
                  {recentWork.map((work) => (
                    <div key={work._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{work.complaint?.title}</p>
                        <p className="text-xs text-gray-500">{work.complaint?.category}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          work.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {work.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent work to display</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Work Session Modal */}
      <AnimatePresence>
        {isWorkModalOpen && selectedComplaint && (
          <WorkSessionModal
            complaint={selectedComplaint}
            activeSession={activeSession}
            onClose={() => {
              setIsWorkModalOpen(false);
              setSelectedComplaint(null);
              fetchDashboardData(); // Refresh data after work session
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Complaint Card Component
const ComplaintCard = ({ complaint, onSelect, isActive }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={() => onSelect(complaint)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{complaint.title}</h3>
            {isActive && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <FiMapPin className="h-3 w-3 mr-1" />
              <span>{complaint.address}</span>
            </div>
            <div className="flex items-center">
              <FiUser className="h-3 w-3 mr-1" />
              <span>{complaint.citizen?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
            {complaint.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
            {complaint.status.replace('_', ' ')}
          </span>
          <div className="flex items-center text-blue-600 hover:text-blue-800">
            <span className="text-xs font-medium mr-1">Start Work</span>
            <FiPlay className="h-3 w-3" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FieldStaffDashboardNew;