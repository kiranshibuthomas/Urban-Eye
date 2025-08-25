import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useNavigate } from 'react-router-dom';
import ModernStatCard from '../components/ModernStatCard';
import ModernComplaintCard from '../components/ModernComplaintCard';
import ModernStaffCard from '../components/ModernStaffCard';
import ModernSearchFilter from '../components/ModernSearchFilter';
import ModernQuickActions from '../components/ModernQuickActions';
import ModernRecentActivity from '../components/ModernRecentActivity';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
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
    totalComplaints: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    totalUsers: 0,
    activeStaff: 0,
    avgResolutionTime: '',
    satisfactionRate: ''
  });
  const [allComplaints, setAllComplaints] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API calls
        // const statsResponse = await fetch('/api/admin/stats');
        // const complaintsResponse = await fetch('/api/admin/complaints');
        // const staffResponse = await fetch('/api/admin/staff');
        
        // For now, keeping empty data
        // setStats(await statsResponse.json());
        // setAllComplaints(await complaintsResponse.json());
        // setStaffMembers(await staffResponse.json());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);





  const getStatusColor = (status) => {
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
  };

  const getPriorityColor = (priority) => {
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
  };

  const getStatusIcon = (status) => {
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
  };

  // Using ModernStatCard component instead of inline StatCard

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatCard
          icon={FiFileText}
          title="Total Complaints"
          value={stats.totalComplaints > 0 ? stats.totalComplaints.toLocaleString() : '0'}
          change={0}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
        />
        <ModernStatCard
          icon={FiClock}
          title="Pending"
          value={stats.pending > 0 ? stats.pending : '0'}
          change={0}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.2}
        />
        <ModernStatCard
          icon={FiActivity}
          title="In Progress"
          value={stats.inProgress > 0 ? stats.inProgress : '0'}
          change={0}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          delay={0.3}
        />
        <ModernStatCard
          icon={FiCheckCircle}
          title="Resolved"
          value={stats.resolved > 0 ? stats.resolved.toLocaleString() : '0'}
          change={0}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0.4}
        />
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
              key={complaint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors duration-200"
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
                      {complaint.location}
                    </span>
                    <span className="flex items-center">
                      <FiUser className="h-4 w-4 mr-1" />
                      {complaint.citizen}
                    </span>
                    <span className="flex items-center">
                  <FiCalendar className="h-4 w-4 mr-1" />
                      {new Date(complaint.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace('-', ' ')}
                </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                  Assign
                  </motion.button>
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
  );

  const ComplaintsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Enhanced Header with Search and Filters */}
      <ModernSearchFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Complaints Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {allComplaints.length > 0 ? (
          allComplaints.map((complaint, index) => (
            <ModernComplaintCard
            key={complaint.id}
              complaint={complaint}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
              index={index}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FiFileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-500">Complaints will appear here when citizens submit them</p>
                </div>
        )}
      </div>
    </motion.div>
  );

  const StaffTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <h3 className="text-xl font-semibold text-gray-900">Staff Management</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add New Staff</span>
          </motion.button>
        </div>
      </div>

      <div className="grid gap-6">
        {staffMembers.length > 0 ? (
          staffMembers.map((staff, index) => (
            <ModernStaffCard
            key={staff.id}
              staff={staff}
              index={index}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <FiUsers className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-500">Staff members will appear here when they are added</p>
                </div>
        )}
      </div>
    </motion.div>
  );

  const AlertsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
            Save as Draft
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <FiSend className="h-4 w-4" />
              <span>Send Alert Now</span>
            </motion.button>
        </div>
      </form>
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'complaints':
        return <ComplaintsTab />;
      case 'staff':
        return <StaffTab />;
      case 'alerts':
        return <AlertsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage complaints, staff, and system alerts</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Tab Navigation */}
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'overview', label: 'Overview', icon: FiTrendingUp },
                  { key: 'complaints', label: 'Complaints', icon: FiFileText },
                  { key: 'staff', label: 'Staff', icon: FiUsers },
                  { key: 'alerts', label: 'Alerts', icon: FiSend }
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* User Menu Dropdown */}
              <div className="relative user-menu-dropdown">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <FiUser className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

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
                        <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'admin@urboneye.com'}</p>
                      </div>
                      
                      <div className="py-1">
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                        >
                          <FiUser className="h-4 w-4 mr-3" />
                          Profile
                        </button>
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                        >
                          <FiSettings className="h-4 w-4 mr-3" />
                          Settings
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
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
