import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import FieldStaffComplaintDetail from '../components/FieldStaffComplaintDetail';
import FieldStaffWorkflow from '../components/FieldStaffWorkflow';
import OptimizedProgressTracker from '../components/OptimizedProgressTracker';
import ModernStatCard from '../components/ModernStatCard';
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
  FiMessageSquare
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FieldStaffDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isOptimizedModalOpen, setIsOptimizedModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  const { user, logout } = useAuth();
  const { logout: sessionLogout } = useSession();
  const navigate = useNavigate();

  const departmentColors = {
    sanitation: { bg: 'bg-green-100', text: 'text-green-800', icon: '🧹' },
    water_supply: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💧' },
    electricity: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚡' },
    public_works: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🔧' }
  };

  const departmentNames = {
    sanitation: 'Sanitation',
    water_supply: 'Water Supply',
    electricity: 'Electricity',
    public_works: 'Public Works'
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/field-staff/dashboard', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.dashboard);
        } else {
          toast.error(data.message || 'Failed to fetch dashboard data');
        }
      } else {
        const errorData = await response.json();
        
        // Handle token expiration
        if (response.status === 401 && errorData.message === 'Token has expired.') {
          toast.error('Your session has expired. Please log in again.');
          await sessionLogout();
          return;
        }
        
        toast.error(errorData.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/field-staff/complaints', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComplaints(data.complaints);
        }
      } else if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.message === 'Token has expired.') {
          toast.error('Your session has expired. Please log in again.');
          await sessionLogout();
          return;
        }
      }
    } catch (error) {
      console.error('Complaints fetch error:', error);
      toast.error('Failed to fetch complaints');
    }
  };

  const handleLogout = async () => {
    await sessionLogout();
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setIsComplaintModalOpen(true);
  };

  const handleOpenManagement = (complaint) => {
    setSelectedComplaint(complaint);
    setIsWorkflowModalOpen(true);
  };

  const handleOpenOptimized = (complaint) => {
    setSelectedComplaint(complaint);
    setIsOptimizedModalOpen(true);
  };

  const handleStatusUpdate = async (complaintId, status, notes) => {
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaintId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchDashboardData();
          fetchComplaints();
          return data;
        } else {
          throw new Error(data.message || 'Failed to update status');
        }
      } else {
        const errorData = await response.json();
        console.error('Status update error response:', errorData);
        if (response.status === 401 && errorData.message === 'Token has expired.') {
          toast.error('Your session has expired. Please log in again.');
          await sessionLogout();
          return;
        }
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update status`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      throw error;
    }
  };

  const handleProgressUpdate = async (complaintId, notes) => {
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaintId}/update-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchDashboardData();
          fetchComplaints();
          return data;
        } else {
          throw new Error(data.message || 'Failed to update progress');
        }
      } else {
        const errorData = await response.json();
        console.error('Progress update error response:', errorData);
        if (response.status === 401 && errorData.message === 'Token has expired.') {
          toast.error('Your session has expired. Please log in again.');
          await sessionLogout();
          return;
        }
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update progress`);
      }
    } catch (error) {
      console.error('Progress update error:', error);
      throw error;
    }
  };

  const handleWorkComplete = async (complaintId, completionNotes, proofImages) => {
    try {
      const formData = new FormData();
      formData.append('completionNotes', completionNotes);
      
      // Add proof images
      proofImages.forEach((file, index) => {
        formData.append('proofImages', file);
      });

      const response = await fetch(`/api/field-staff/complaints/${complaintId}/complete-work`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchDashboardData();
          fetchComplaints();
          return data;
        } else {
          throw new Error(data.message || 'Failed to complete work');
        }
      } else {
        if (response.status === 401) {
          const errorData = await response.json();
          if (errorData.message === 'Token has expired.') {
            toast.error('Your session has expired. Please log in again.');
            await sessionLogout();
            return;
          }
        }
        throw new Error('Failed to complete work');
      }
    } catch (error) {
      console.error('Complete work error:', error);
      throw error;
    }
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'assigned': return 'text-orange-600 bg-orange-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'work_completed': return 'text-purple-600 bg-purple-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Filter complaints based on search and filters
  const filteredComplaints = useMemo(() => {
    if (!dashboardData?.assignedComplaints) return [];
    
    return dashboardData.assignedComplaints.filter(complaint => {
      const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [dashboardData?.assignedComplaints, searchQuery, statusFilter, priorityFilter]);

  const refreshData = useCallback(() => {
    fetchDashboardData();
    fetchComplaints();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading Field Staff Dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Failed to load dashboard</div>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { fieldStaff, stats, assignedComplaints, recentActivity } = dashboardData;
  const deptColor = departmentColors[fieldStaff.department] || departmentColors.sanitation;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Modern Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <FiShield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">UrbanEye</h1>
                  <p className="text-sm text-gray-500">Field Staff Dashboard</p>
                </div>
              </div>
              
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${deptColor.bg} ${deptColor.text}`}>
                <span className="mr-2">{deptColor.icon}</span>
                {departmentNames[fieldStaff.department]} Department
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={user?.avatar}
                      alt={user?.name || 'User'}
                      className="h-8 w-8 rounded-full object-cover bg-gradient-to-r from-blue-500 to-purple-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full items-center justify-center text-white text-xs font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">Field Staff</p>
                  </div>
                  <FiChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                    >
                      <button
                        onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiUser className="mr-3 h-4 w-4" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiSettings className="mr-3 h-4 w-4" />
                        Preferences
                      </button>
                      <hr className="my-2" />
                      <button
                        onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${deptColor.bg} rounded-2xl p-8 mb-8`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-3xl font-bold ${deptColor.text} mb-2`}>
                    Welcome back, {fieldStaff.name}! 👋
                  </h2>
                  <p className={`${deptColor.text} opacity-80 text-lg`}>
                    You have {stats.totalAssigned} assigned complaints to work on today.
                  </p>
                </div>
                <div className="text-6xl opacity-20">
                  {deptColor.icon}
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <ModernStatCard
                icon={FiClipboard}
                title="Total Assigned"
                value={stats.totalAssigned}
                color="bg-blue-500"
                delay={0.1}
              />
              <ModernStatCard
                icon={FiClock}
                title="Pending"
                value={stats.assigned}
                color="bg-orange-500"
                delay={0.2}
              />
              <ModernStatCard
                icon={FiActivity}
                title="In Progress"
                value={stats.inProgress}
                color="bg-blue-600"
                delay={0.3}
              />
              <ModernStatCard
                icon={FiTarget}
                title="Work Completed"
                value={stats.workCompleted}
                color="bg-purple-500"
                delay={0.4}
              />
              <ModernStatCard
                icon={FiCheckCircle}
                title="Resolved"
                value={stats.resolved}
                color="bg-green-500"
                delay={0.5}
              />
            </div>

            {/* Complaints Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Your Assigned Complaints</h3>
                    <p className="text-gray-500 mt-1">Manage and update your assigned complaints</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Search */}
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search complaints..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="work_completed">Work Completed</option>
                      <option value="resolved">Resolved</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <FiGrid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <FiList className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {filteredComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <FiClipboard className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'You don\'t have any assigned complaints yet'
                      }
                    </p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                    <AnimatePresence>
                      {filteredComplaints.map((complaint, index) => (
                        <motion.div
                          key={complaint._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className={`${viewMode === 'grid' ? 'bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow' : 'bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow'}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">{complaint.title}</h4>
                              <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                              
                              <div className="flex items-center space-x-3 mb-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                                  {complaint.priority}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                                  {complaint.status.replace('_', ' ')}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <FiCalendar className="h-4 w-4 mr-1" />
                                  {formatDate(complaint.fieldStaffAssignedAt)}
                                </span>
                                <span className="flex items-center">
                                  <FiMapPin className="h-4 w-4 mr-1" />
                                  {complaint.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewComplaint(complaint)}
                              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              <FiEye className="h-4 w-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => handleOpenOptimized(complaint)}
                              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <FiZap className="h-4 w-4 mr-1" />
                              Optimized
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Complaint Detail Modal */}
      <AnimatePresence>
        {isComplaintModalOpen && selectedComplaint && (
          <FieldStaffComplaintDetail
            complaint={selectedComplaint}
            onClose={() => setIsComplaintModalOpen(false)}
            onStatusUpdate={handleStatusUpdate}
            onWorkComplete={handleWorkComplete}
          />
        )}
      </AnimatePresence>

      {/* Workflow Modal */}
      <AnimatePresence>
        {isWorkflowModalOpen && selectedComplaint && (
          <FieldStaffWorkflow
            complaint={selectedComplaint}
            onClose={() => setIsWorkflowModalOpen(false)}
            onStatusUpdate={handleStatusUpdate}
            onWorkComplete={handleWorkComplete}
          />
        )}
      </AnimatePresence>

      {/* Optimized Progress Modal */}
      <AnimatePresence>
        {isOptimizedModalOpen && selectedComplaint && (
          <OptimizedProgressTracker
            complaint={selectedComplaint}
            onClose={() => setIsOptimizedModalOpen(false)}
            onStatusUpdate={handleStatusUpdate}
            onProgressUpdate={handleProgressUpdate}
            onWorkComplete={handleWorkComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FieldStaffDashboard;
