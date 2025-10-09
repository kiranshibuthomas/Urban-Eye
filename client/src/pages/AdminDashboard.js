import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from '../utils/performanceUtils';
import { 
  FiUsers, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiMapPin,
  FiCalendar,
  FiEye,
  FiSend,
  FiUserCheck,
  FiTrendingUp,
  FiFilter,
  FiUser,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit3,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiBarChart3,
  FiActivity,
  FiTarget,
  FiShield,
  FiZap,
  FiMessageSquare,
  FiBell,
  FiSettings,
  FiGrid,
  FiList,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ModernStatCard from '../components/ModernStatCard';
import ModernComplaintCard from '../components/ModernComplaintCard';
import ModernSearchFilter from '../components/ModernSearchFilter';
import ModernQuickActions from '../components/ModernQuickActions';
import ModernRecentActivity from '../components/ModernRecentActivity';
import AdminComplaintManagement from './AdminComplaintManagement';
import UserManagement from './UserManagement';
import FieldStaffManagement from './FieldStaffManagement';
import AdminWorkApprovalList from '../components/AdminWorkApprovalList';
import {
  ComplaintsTrendChart,
  StatusOverviewChart
} from '../components/DashboardCharts';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    // Get tab from URL params, default to 'overview'
    return searchParams.get('tab') || 'overview';
  });
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    deleted: 0,
    totalUsers: 0,
    activeStaff: 0,
    avgResolutionTime: '',
    satisfactionRate: ''
  });
  const [allComplaints, setAllComplaints] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isBackgroundUpdating, setIsBackgroundUpdating] = useState(false);
  const { user, logout } = useAuth();
  const { logout: sessionLogout } = useSession();
  const navigate = useNavigate();
  
  // Refs to track loading states without causing re-renders
  const isLoadingRef = useRef(isLoading);
  const isBackgroundUpdatingRef = useRef(isBackgroundUpdating);
  
  // Keep refs in sync with state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  
  useEffect(() => {
    isBackgroundUpdatingRef.current = isBackgroundUpdating;
  }, [isBackgroundUpdating]);

  // Sync activeTab with URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleLogout = async () => {
    await sessionLogout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsBackgroundUpdating(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Fetch stats, complaints, and analytics in parallel
      const [statsResponse, complaintsResponse, analyticsResponse] = await Promise.all([
        fetch('/api/complaints/stats/overview', { credentials: 'include' }),
        fetch('/api/complaints?limit=10', { credentials: 'include' }),
        fetch('/api/analytics/dashboard', { credentials: 'include' })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          console.log('Dashboard stats received:', statsData.stats);
          
          // Fetch analytics data and merge with stats
          let mergedStats = { ...statsData.stats };
          
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            if (analyticsData.success) {
              console.log('📊 Analytics data received:', analyticsData.data);
              console.log('📈 Trend data array:', analyticsData.data.trendData);
              mergedStats = {
                ...mergedStats,
                trendData: analyticsData.data.trendData
              };
            }
          } else {
            console.error('❌ Analytics API failed with status:', analyticsResponse.status);
          }
          
          setStats(mergedStats);
        }
      }

      if (complaintsResponse.ok) {
        const complaintsData = await complaintsResponse.json();
        if (complaintsData.success) {
          setAllComplaints(complaintsData.complaints);
        }
      }
      
      setLastUpdate(new Date());
      
      // Show subtle notification for background updates
      if (isBackground) {
        toast.success('Data updated', {
          duration: 2000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
            fontSize: '14px',
          },
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (isBackground) {
        setIsBackgroundUpdating(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Optimized background refresh - less aggressive, more efficient
  useEffect(() => {
    let interval;
    let lastActivity = Date.now();
    
    const resetActivityTimer = debounce(() => {
      lastActivity = Date.now();
    }, 2000); // Debounce activity tracking
    
    const checkAndRefresh = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      // Only refresh if:
      // 1. Tab is visible (user is on the page)
      // 2. User has been idle for at least 5 minutes (reduced frequency)
      // 3. No loading is in progress
      if (document.visibilityState === 'visible' && 
          timeSinceActivity > 300000 && // 5 minutes instead of 2
          !isLoadingRef.current && 
          !isBackgroundUpdatingRef.current) {
        fetchDashboardData(true); // Background update
        lastActivity = now; // Reset activity timer after refresh
      }
    };
    
    // Set up activity tracking with minimal events
    const events = ['mousedown', 'keypress', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });
    
    // Check every 60 seconds instead of 30 (reduced frequency)
    interval = setInterval(checkAndRefresh, 60000);
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
      });
    };
  }, [fetchDashboardData]); // fetchDashboardData is stable due to useCallback






  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }, []);

  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-4 w-4" />;
      case 'in-progress':
        return <FiActivity className="h-4 w-4" />;
      case 'resolved':
        return <FiCheckCircle className="h-4 w-4" />;
      default:
        return <FiFileText className="h-4 w-4" />;
    }
  }, []);

  // Using ModernStatCard component instead of inline StatCard

  const OverviewTab = useMemo(() => (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <ModernStatCard
          icon={FiFileText}
          title="Total Complaints"
          value={stats.total > 0 ? stats.total.toLocaleString() : '0'}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
          isLive={true}
        />
        <ModernStatCard
          icon={FiClock}
          title="Pending"
          value={stats.pending > 0 ? stats.pending : '0'}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.2}
          isLive={true}
        />
        <ModernStatCard
          icon={FiActivity}
          title="In Progress"
          value={stats.inProgress > 0 ? stats.inProgress : '0'}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          delay={0.3}
          isLive={true}
        />
        <ModernStatCard
          icon={FiCheckCircle}
          title="Resolved"
          value={stats.resolved > 0 ? stats.resolved.toLocaleString() : '0'}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0.4}
          isLive={true}
        />
        <ModernStatCard
          icon={FiAlertCircle}
          title="Rejected"
          value={stats.rejected > 0 ? stats.rejected : '0'}
          color="bg-gradient-to-br from-red-500 to-red-600"
          delay={0.5}
          isLive={true}
        />
          </div>

      {/* Analytics & Charts Section - KEY INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ComplaintsTrendChart data={stats.trendData} />
        <StatusOverviewChart stats={stats} />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ModernRecentActivity
          complaints={allComplaints}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          getStatusIcon={getStatusIcon}
        />

        <ModernQuickActions />
      </div>

      {/* Additional Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModernStatCard
          icon={FiUsers}
          title="Total Users"
          value={stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : '0'}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.7}
          isLive={true}
        />
        <ModernStatCard
          icon={FiUserCheck}
          title="Active Staff"
          value={stats.activeStaff > 0 ? stats.activeStaff : '0'}
          color="bg-gradient-to-br from-green-500 to-green-600"
          delay={0.7}
          isLive={true}
        />
        <ModernStatCard
          icon={FiTrendingUp}
          title="Satisfaction"
          value={stats.satisfactionRate || '0%'}
          color="bg-gradient-to-br from-pink-500 to-pink-600"
          delay={0.8}
          isLive={true}
        />
      </div>

      {/* Priority Complaints Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">High Priority Complaints</h3>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {allComplaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length || 0} Active
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {allComplaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length > 0 ? (
            allComplaints.filter(c => c.priority === 'urgent' || c.priority === 'high').map((complaint, index) => (
            <motion.div
              key={complaint._id || complaint.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(0.05 * index, 0.3), duration: 0.3 }}
              className="p-6 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
              <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <span className="flex items-center">
                  <FiMapPin className="h-4 w-4 mr-1" />
                      {complaint.address || 'Location not specified'}
                    </span>
                    <span className="flex items-center">
                      <FiUser className="h-4 w-4 mr-1" />
                      {complaint.citizenName || complaint.citizen?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center">
                  <FiCalendar className="h-4 w-4 mr-1" />
                      {new Date(complaint.submittedAt || complaint.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace('-', ' ')}
                </span>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 font-medium"
                  >
                  Assign
                  </button>
                </div>
              </div>
            </motion.div>
          ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <FiFileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No high priority complaints</p>
              <p className="text-sm">All complaints are being handled efficiently</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  ), [stats, allComplaints, getStatusColor, getPriorityColor, getStatusIcon]);

  const AlertsTab = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Send Emergency Alert</h3>
          <p className="text-sm text-gray-600 mt-1">Send notifications to citizens and staff members</p>
        </div>
        
        <form className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
            <option value="">Select alert type</option>
            <option value="emergency">Emergency</option>
            <option value="maintenance">Maintenance</option>
            <option value="announcement">General Announcement</option>
            <option value="weather">Weather Warning</option>
          </select>
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Title</label>
          <input
            type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            placeholder="Brief title for the alert"
          />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            placeholder="Enter the alert message..."
          />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
            <option value="all">All Citizens</option>
            <option value="area">Specific Area</option>
            <option value="role">Specific Role</option>
          </select>
        </div>

          <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
              <label className="ml-3 block text-sm text-gray-900">
            Send SMS notifications
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
              <label className="ml-3 block text-sm text-gray-900">
            Send email notifications
          </label>
        </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-3 block text-sm text-gray-900">
                Send push notifications
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-150 font-medium"
            >
            Save as Draft
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 font-medium flex items-center space-x-2"
            >
              <FiSend className="h-4 w-4" />
              <span>Send Alert Now</span>
            </button>
        </div>
        </form>
      </div>
    </motion.div>
  ), []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return OverviewTab;
      case 'complaints':
        return <AdminComplaintManagement />;
      case 'work-approval':
        return <AdminWorkApprovalList />;
      case 'users':
        return <UserManagement />;
      case 'field-staff':
        return <FieldStaffManagement />;
      case 'alerts':
        return AlertsTab;
      default:
        return OverviewTab;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-base text-gray-600 mt-1">Manage complaints, staff, and system alerts</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Smart Update Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isBackgroundUpdating ? 'bg-blue-500 animate-pulse' : 
                  'bg-green-500'
                }`}></div>
                <span className="text-base text-gray-600">
                  {isBackgroundUpdating ? 'Updating...' : 'Smart Sync'}
                </span>
                {lastUpdate && (
                  <span className="text-sm text-gray-500">
                    {new Date(lastUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchDashboardData(false)}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Tab Navigation */}
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'overview', label: 'Overview', icon: FiTrendingUp },
                  { key: 'complaints', label: 'Complaints', icon: FiFileText },
                  { key: 'work-approval', label: 'Work Approval', icon: FiCheckCircle },
                  { key: 'users', label: 'Users', icon: FiUsers },
                  { key: 'field-staff', label: 'Field Staff', icon: FiShield },
                  { key: 'alerts', label: 'Alerts', icon: FiSend }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setSearchParams({ tab: tab.key });
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-base font-medium transition-all duration-150 ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

            {/* User Menu Dropdown */}
            <div className="relative user-menu-dropdown group">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-150"
              >
                  <img
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    className="h-8 w-8 rounded-full object-cover bg-gradient-to-r from-blue-500 to-indigo-500"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full items-center justify-center text-white text-xs font-semibold">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-base font-medium text-gray-900">{user?.name || 'Admin'}</p>
                    <p className="text-sm text-gray-500">Administrator</p>
                  </div>
                  <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-base font-medium text-gray-900">{user?.name || 'Admin'}</p>
                      </div>
                      
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => navigate('/profile')}
                          className="w-full px-4 py-2 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                        >
                          <FiUser className="h-4 w-4 mr-3" />
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/admin-settings')}
                          className="w-full px-4 py-2 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                        >
                          <FiSettings className="h-4 w-4 mr-3" />
                          Admin Settings
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-base text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
                        >
                          <FiLogOut className="h-4 w-4 mr-3" />
                          Sign Out
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
              <main className="px-6 py-8">
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading dashboard data...</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
      {renderContent()}
                  </AnimatePresence>
                )}
              </main>
    </div>
  );
};

export default AdminDashboard;
