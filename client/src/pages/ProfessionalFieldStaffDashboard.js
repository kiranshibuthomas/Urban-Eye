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
  FiWifiOff,
  FiBell,
  FiCalendar,
  FiTrendingUp,
  FiAward,
  FiFilter,
  FiSearch,
  FiMoreVertical,
  FiUsers,
  FiX,
  FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfessionalWorkSessionModal from '../components/ProfessionalWorkSessionModal';
import TeamFormationModal from '../components/TeamFormationModal';
import TeamInvitationsPanel from '../components/TeamInvitationsPanel';

const ProfessionalFieldStaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamFormationComplaint, setTeamFormationComplaint] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Handle complaint selection - Navigate to detail page
  const handleComplaintSelect = (complaint) => {
    navigate(`/field-staff/task/${complaint._id}`);
  };

  // Handle team formation
  const handleTeamFormation = (complaint) => {
    setTeamFormationComplaint(complaint);
    setIsTeamModalOpen(true);
  };

  // Make team formation handler available globally for ComplaintCard
  useEffect(() => {
    window.handleTeamFormation = handleTeamFormation;
    return () => {
      delete window.handleTeamFormation;
    };
  }, []);

  // Handle team created
  const handleTeamCreated = (teamData) => {
    // Refresh dashboard to show updated data
    fetchDashboardData();
    // Show success message
    toast.success('Team created successfully! You can now invite members.');
  };

  // Handle team view
  const handleViewTeam = (complaint) => {
    // Fetch team details for this complaint
    fetchTeamForComplaint(complaint._id);
  };

  // Fetch team for complaint
  const fetchTeamForComplaint = async (complaintId) => {
    try {
      const response = await fetch(`/api/teams/my/teams?status=forming,ready,active`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        const team = data.teams.find(t => t.complaint._id === complaintId);
        if (team) {
          setTeamFormationComplaint({ ...selectedComplaint, teamId: team._id, team });
          setIsTeamModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Fetch team error:', error);
      toast.error('Failed to load team details');
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

  // Filter complaints
  const filteredComplaints = dashboardData?.assignedComplaints?.filter(complaint => {
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const { assignedComplaints, activeSession, stats, recentWork } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="w-full px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Brand & Status */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FiActivity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Field Operations</h1>
                  <p className="text-sm text-gray-500">Professional Dashboard</p>
                </div>
              </div>
              
              {/* Network & Time Status */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <FiWifi className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      <FiWifiOff className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Offline</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                  <FiClock className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Actions & Profile */}
            <div className="flex items-center space-x-4">
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Refresh data"
              >
                <FiRefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Notifications */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 relative">
                <FiBell className="h-5 w-5" />
                {activeSession && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-white" />
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.department}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => navigate('/profile')}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    title="Profile"
                  >
                    <FiSettings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <FiLogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Active Work Session Alert */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full px-2 sm:px-4 lg:px-6 pt-6"
        >
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiActivity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Active Work Session</h3>
                  <p className="text-blue-100">
                    {activeSession.complaint?.title}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      activeSession.status === 'started' || activeSession.status === 'resumed'
                        ? 'bg-green-500/20 text-green-100'
                        : 'bg-yellow-500/20 text-yellow-100'
                    }`}>
                      {activeSession.status === 'paused' ? 'Paused' : 'In Progress'}
                    </span>
                    <span className="text-blue-100 text-sm">
                      Started: {new Date(activeSession.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleComplaintSelect(activeSession.complaint)}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <span>Continue Work</span>
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-8">
        {/* Team Invitations Panel */}
        <div className="mb-8">
          <TeamInvitationsPanel onInvitationResponse={fetchDashboardData} />
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ProfessionalStatCard
            title="Active Tasks"
            value={stats?.totalAssigned || 0}
            icon={FiList}
            color="blue"
            trend="+2 this week"
          />
          <ProfessionalStatCard
            title="Completed"
            value={stats?.completedThisMonth || 0}
            icon={FiCheckCircle}
            color="green"
            trend="This month"
          />
          <ProfessionalStatCard
            title="Work Hours"
            value={`${stats?.totalWorkHours || 0}h`}
            icon={FiClock}
            color="purple"
            trend="Total logged"
          />
          <ProfessionalStatCard
            title="Efficiency"
            value={`${stats?.averageWorkTime || 0}m`}
            icon={FiTrendingUp}
            color="orange"
            trend="Avg per task"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Complaints */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Assigned Tasks</h2>
                    <p className="text-gray-600 mt-1">
                      {filteredComplaints.length} of {assignedComplaints?.length || 0} tasks
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                      <FiFilter className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                      <FiMoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Search and Filter */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredComplaints.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredComplaints.map((complaint) => (
                      <ProfessionalComplaintCard
                        key={complaint._id}
                        complaint={complaint}
                        onSelect={handleComplaintSelect}
                        onTeamFormation={handleTeamFormation}
                        isActive={activeSession?.complaint?._id === complaint._id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiList className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks found</h3>
                    <p className="mt-2 text-gray-500">
                      {searchQuery || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'You don\'t have any tasks assigned at the moment'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiTarget className="h-5 w-5 mr-2 text-blue-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <ProfessionalActionButton
                  icon={FiClock}
                  label="Work History"
                  description="View past assignments"
                  onClick={() => setShowHistoryModal(true)}
                />
                <ProfessionalActionButton
                  icon={FiBarChart2}
                  label="Performance"
                  description="Check your stats"
                  onClick={() => navigate('/field-work/statistics')}
                />
                <ProfessionalActionButton
                  icon={FiNavigation}
                  label="Location Status"
                  description="Update your location"
                  onClick={() => {/* Handle location update */}}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiActivity className="h-5 w-5 mr-2 text-green-600" />
                Recent Activity
              </h3>
              {recentWork && recentWork.length > 0 ? (
                <div className="space-y-3">
                  {recentWork.slice(0, 3).map((work) => (
                    <div key={work._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FiCheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                            {work.complaint?.title}
                          </p>
                          <p className="text-xs text-gray-500">{work.complaint?.category}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        work.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {work.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>

            {/* Performance Badge */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3">
                <FiAward className="h-8 w-8" />
                <div>
                  <h4 className="font-bold">Top Performer</h4>
                  <p className="text-sm opacity-90">Keep up the excellent work!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Professional Work Session Modal */}
      <AnimatePresence>
        {isWorkModalOpen && selectedComplaint && (
          <ProfessionalWorkSessionModal
            complaint={selectedComplaint}
            activeSession={activeSession}
            onClose={() => {
              setIsWorkModalOpen(false);
              setSelectedComplaint(null);
              fetchDashboardData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Team Formation Modal */}
      <AnimatePresence>
        {isTeamModalOpen && teamFormationComplaint && (
          <TeamFormationModal
            complaint={teamFormationComplaint}
            onClose={() => {
              setIsTeamModalOpen(false);
              setTeamFormationComplaint(null);
            }}
            onTeamCreated={handleTeamCreated}
          />
        )}
      </AnimatePresence>

      {/* Work History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <WorkHistoryModal onClose={() => setShowHistoryModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// Professional Stat Card Component
const ProfessionalStatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    green: 'from-green-500 to-green-600 text-green-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    orange: 'from-orange-500 to-orange-600 text-orange-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{trend}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Professional Complaint Card Component
const ProfessionalComplaintCard = ({ complaint, onSelect, onTeamFormation, isActive }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
        isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
      onClick={() => onSelect(complaint)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {complaint.title}
            </h3>
            {isActive && (
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full animate-pulse">
                Active
              </span>
            )}
          </div>
          
          <p className="text-gray-600 mb-4 line-clamp-2">{complaint.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center">
              <FiMapPin className="h-4 w-4 mr-1" />
              <span className="truncate max-w-32">{complaint.address}</span>
            </div>
            <div className="flex items-center">
              <FiUser className="h-4 w-4 mr-1" />
              <span>{complaint.citizen?.name}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="h-4 w-4 mr-1" />
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="ml-4 flex flex-col items-end space-y-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelect(complaint);
            }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FiPlay className="h-4 w-4" />
            <span>Start Work</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onTeamFormation) {
                onTeamFormation(complaint);
              }
            }}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FiUsers className="h-4 w-4" />
            <span>Create Team</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-sm">
            <FiEye className="h-4 w-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Professional Action Button Component
const ProfessionalActionButton = ({ icon: Icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
  >
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
        <Icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <FiChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
  </button>
);

// Work History Modal
const WorkHistoryModal = ({ onClose }) => {
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchHistory(1); }, []);

  const fetchHistory = async (p) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/field-work/history?page=${p}&limit=10`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setWorkLogs(data.workLogs);
        setPagination(data.pagination);
        setPage(p);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reviewColor = (r) => ({ approved: 'text-emerald-600', rejected: 'text-red-600', needs_revision: 'text-orange-500', pending: 'text-yellow-600' }[r] || 'text-gray-400');
  const reviewBg = (r) => ({ approved: 'bg-emerald-50 border-emerald-200', rejected: 'bg-red-50 border-red-200', needs_revision: 'bg-orange-50 border-orange-200', pending: 'bg-yellow-50 border-yellow-200' }[r] || 'bg-gray-50 border-gray-200');
  const reviewLabel = (r) => ({ approved: '✓ Approved', rejected: '✗ Rejected', needs_revision: '↩ Needs Revision', pending: '⏳ Pending Review' }[r] || r);

  const formatDuration = (ms) => {
    if (!ms) return '–';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiClock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Work History</h2>
              {pagination && <p className="text-xs text-gray-500">{pagination.totalItems} sessions total</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : workLogs.length === 0 ? (
            <div className="text-center py-16">
              <FiList className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">No work history yet</p>
              <p className="text-xs text-gray-400 mt-1">Completed sessions will appear here</p>
            </div>
          ) : (
            workLogs.map((log) => log.complaint && (
              <div key={log._id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{log.complaint?.title || 'Unknown complaint'}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize truncate">
                        {log.complaint?.category?.replace(/_/g, ' ')} · {log.complaint?.address}
                      </p>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${reviewBg(log.reviewStatus)} ${reviewColor(log.reviewStatus)}`}>
                          {reviewLabel(log.reviewStatus)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center">
                          <FiClock className="h-3 w-3 mr-1" />{formatDuration(log.totalDuration)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {log.progressUpdates?.length || 0} updates
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <p className="text-xs text-gray-400">{new Date(log.startTime).toLocaleDateString()}</p>
                      <FiChevronDown className={`h-4 w-4 text-gray-400 mt-2 transition-transform ${expanded === log._id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {expanded === log._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-3 overflow-hidden"
                    >
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Duration', value: formatDuration(log.totalDuration) },
                          { label: 'Updates', value: log.progressUpdates?.length || 0 },
                          { label: 'Proof Photos', value: log.completionImages?.length || 0 },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-sm font-bold text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress updates */}
                      {log.progressUpdates?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1.5">Progress Updates</p>
                          <div className="space-y-1">
                            {log.progressUpdates.map((u, i) => (
                              <div key={i} className="flex items-start space-x-2 text-xs text-gray-700">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                                <span>{u.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completion notes */}
                      {log.completionNotes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Completion Notes</p>
                          <p className="text-xs text-gray-700 bg-white rounded-lg p-2.5 border border-gray-100">{log.completionNotes}</p>
                        </div>
                      )}

                      {/* Admin feedback */}
                      {log.reviewNotes && (
                        <div className={`rounded-lg p-2.5 border text-xs ${log.reviewStatus === 'rejected' || log.reviewStatus === 'needs_revision' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                          <p className="font-semibold mb-0.5">Admin Feedback</p>
                          <p>{log.reviewNotes}</p>
                        </div>
                      )}

                      {/* Proof images */}
                      {log.completionImages?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1.5">Proof Photos</p>
                          <div className="flex space-x-2 overflow-x-auto pb-1">
                            {log.completionImages.map((img, i) => (
                              <img key={i} src={img.url} alt="" className="h-16 w-16 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        {new Date(log.startTime).toLocaleString()}{log.endTime ? ` → ${new Date(log.endTime).toLocaleString()}` : ''}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 flex-shrink-0">
            <p className="text-xs text-gray-500">Page {page} of {pagination.totalPages}</p>
            <div className="flex space-x-2">
              <button onClick={() => fetchHistory(page - 1)} disabled={!pagination.hasPrev}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => fetchHistory(page + 1)} disabled={!pagination.hasNext}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfessionalFieldStaffDashboard;