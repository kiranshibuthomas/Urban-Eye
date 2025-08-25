import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiMapPin,
  FiCalendar,
  FiTrendingUp,
  FiBarChart2,
  FiSend,
  FiUsers,
  FiShield,
  FiTarget,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiBell,
  FiSettings,
  FiChevronDown,
  FiHome,
  FiMessageSquare,
  FiHeart,
  FiStar,
  FiActivity
} from 'react-icons/fi';
import { FaCity, FaBuilding, FaCog, FaRegSmile } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import SettingsPage from './SettingsPage';

const CitizenDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Set animation flag after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mock data for demonstration
  const stats = {
    totalComplaints: 12,
    pending: 5,
    inProgress: 4,
    resolved: 3
  };

  const recentComplaints = [
    {
      id: 1,
      title: "Broken streetlight on Main St",
      status: "pending",
      date: "2024-01-15",
      category: "Infrastructure",
      location: "Main Street, Block A",
      priority: "High"
    },
    {
      id: 2,
      title: "Pothole near city center",
      status: "in-progress",
      date: "2024-01-12",
      category: "Roads",
      location: "City Center Avenue",
      priority: "Medium"
    },
    {
      id: 3,
      title: "Garbage collection missed",
      status: "resolved",
      date: "2024-01-10",
      category: "Sanitation",
      location: "Residential Area B",
      priority: "Low"
    }
  ];

  const sidebarActions = [
    {
      label: 'Overview',
      icon: FiHome,
      onClick: () => setActiveTab('overview')
    },
    {
      label: 'Submit Complaint',
      icon: FiPlus,
      onClick: () => setActiveTab('submit')
    },
    {
      label: 'My Complaints',
      icon: FiFileText,
      onClick: () => setActiveTab('complaints')
    },
    {
      label: 'Analytics',
      icon: FiBarChart2,
      onClick: () => setActiveTab('analytics')
    },
    {
      label: 'Profile',
      icon: FiUser,
      onClick: () => setActiveTab('profile')
    },
    {
      label: 'Settings',
      icon: FiSettings,
      onClick: () => setActiveTab('settings')
    }
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { 
          bg: 'bg-gradient-to-r from-yellow-50 to-orange-50', 
          text: 'text-yellow-800', 
          ring: 'ring-yellow-200',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'in-progress':
        return { 
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', 
          text: 'text-blue-800', 
          ring: 'ring-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'resolved':
        return { 
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50', 
          text: 'text-green-800', 
          ring: 'ring-green-200',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800'
        };
      default:
        return { 
          bg: 'bg-gray-50', 
          text: 'text-gray-800', 
          ring: 'ring-gray-200',
          icon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 ring-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 ring-green-200';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-4 w-4" />;
      case 'in-progress':
        return <FiAlertCircle className="h-4 w-4" />;
      case 'resolved':
        return <FiCheckCircle className="h-4 w-4" />;
      default:
        return <FiFileText className="h-4 w-4" />;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Modern Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Smart City Welcome Section */}
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-2xl"
      >
        {/* Background city pattern */}
        <div className="absolute inset-0 opacity-10">
          <FaCity className="absolute top-4 right-8 w-16 h-16" />
          <FaBuilding className="absolute bottom-4 left-8 w-12 h-12" />
          <FiUsers className="absolute top-8 left-1/3 w-10 h-10" />
          <FaCog className="absolute bottom-6 right-1/3 w-8 h-8 animate-spin" style={{ animationDuration: '20s' }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 mb-3 sm:mb-0">
              <FaCity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
              <p className="text-purple-100 text-sm">Smart Civic Management Platform</p>
            </div>
          </div>
          <p className="text-indigo-100 mb-6 max-w-2xl text-sm sm:text-base">Your voice matters in building a smarter, better city. Report issues, track progress, and be part of the solution for your community.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('submit')}
            className="bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-semibold hover:bg-white/30 transition-all duration-200 flex items-center space-x-2 border border-white/20 text-sm sm:text-base"
          >
            <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Report New Issue</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Smart City Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-200/30 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-bl-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FiTarget className="h-4 w-4 text-violet-600 mr-2" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Issues</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{stats.totalComplaints}</p>
                <p className="text-xs text-gray-500 mt-1">Reported by you</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiFileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-200/30 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-bl-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FiClock className="h-4 w-4 text-amber-600 mr-2" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Review</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiClock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-200/30 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-bl-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FiShield className="h-4 w-4 text-blue-600 mr-2" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.inProgress}</p>
                <p className="text-xs text-gray-500 mt-1">Being addressed</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiAlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-200/30 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FiCheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Resolved</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.resolved}</p>
                <p className="text-xs text-gray-500 mt-1">Successfully fixed</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Issues Section */}
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
                 className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/30 hover:shadow-2xl transition-all duration-300"
      >
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-200/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-3 sm:mb-0">
               <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3">
                <FiTrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Issues</h3>
                <p className="text-xs sm:text-sm text-gray-600">Track your submitted reports</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('complaints')}
               className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors duration-200 hover:scale-105"
            >
              View All →
            </button>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="space-y-4">
            {recentComplaints.map((complaint, index) => {
              const statusConfig = getStatusConfig(complaint.status);
              return (
                <motion.div
                  key={complaint.id}
                  initial={hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                   whileHover={{ y: -4, scale: 1.02 }}
                  className={`${statusConfig.bg} ${statusConfig.ring} ring-1 rounded-2xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${statusConfig.text} text-sm sm:text-base`}>{complaint.title}</h4>
                        <span className={`${statusConfig.badge} px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset`}>
                          {complaint.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center">
                          <FiMapPin className="h-3 w-3 mr-1" />
                          {complaint.location}
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="h-3 w-3 mr-1" />
                          {complaint.date}
                        </div>
                        <span className={`${getPriorityConfig(complaint.priority)} px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset`}>
                          {complaint.priority}
                        </span>
                      </div>
                    </div>
                    <div className={`ml-4 p-2 rounded-xl ${statusConfig.bg}`}>
                      {getStatusIcon(complaint.status)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Submit Complaint Tab
  const SubmitComplaintTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/30 p-6 sm:p-8"
      >
        <div className="flex items-center mb-6">
           <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3">
            <FiPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Submit New Complaint</h3>
            <p className="text-sm text-gray-600">Help us improve your city by reporting issues</p>
          </div>
        </div>
        
        <form className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title</label>
              <input
                type="text"
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 hover:border-violet-300"
                placeholder="Brief description of the issue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                             <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 hover:border-violet-300">
                <option>Infrastructure</option>
                <option>Roads</option>
                <option>Sanitation</option>
                <option>Safety</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 hover:border-violet-300"
              placeholder="Street address or landmark"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows="4"
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 resize-none hover:border-violet-300"
              placeholder="Detailed description of the issue..."
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
               className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105"
            >
              <FiSend className="h-4 w-4" />
              <span>Submit Complaint</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // My Complaints Tab
  const MyComplaintsTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/30 p-6 sm:p-8"
      >
        <div className="flex items-center mb-6">
           <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3">
            <FiFileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">My Complaints</h3>
            <p className="text-sm text-gray-600">Track all your submitted issues</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {recentComplaints.map((complaint, index) => {
            const statusConfig = getStatusConfig(complaint.status);
            return (
              <motion.div
                key={complaint.id}
                initial={hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`${statusConfig.bg} ${statusConfig.ring} ring-1 rounded-2xl p-4 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${statusConfig.text} text-sm sm:text-base`}>{complaint.title}</h4>
                      <span className={`${statusConfig.badge} px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset`}>
                        {complaint.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiMapPin className="h-3 w-3 mr-1" />
                        {complaint.location}
                      </div>
                      <div className="flex items-center">
                        <FiCalendar className="h-3 w-3 mr-1" />
                        {complaint.date}
                      </div>
                      <span className={`${getPriorityConfig(complaint.priority)} px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset`}>
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                  <div className={`ml-4 p-2 rounded-xl ${statusConfig.bg}`}>
                    {getStatusIcon(complaint.status)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );

  // Analytics Tab
  const AnalyticsTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/30 p-6 sm:p-8"
      >
        <div className="flex items-center mb-6">
           <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3">
            <FiBarChart2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics & Insights</h3>
            <p className="text-sm text-gray-600">Your civic engagement statistics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 border border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <FiActivity className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">This Month</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-900">8</p>
            <p className="text-sm text-emerald-700">New Reports</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <FiTrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Response Rate</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">92%</p>
            <p className="text-sm text-blue-700">Average Response</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <FiStar className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Satisfaction</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-900">4.8</p>
            <p className="text-sm text-purple-700">Out of 5 Stars</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Profile Tab
  const ProfileTab = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      zipCode: user?.zipCode || '',
      preferences: {
        emailNotifications: user?.preferences?.emailNotifications ?? true,
        smsNotifications: user?.preferences?.smsNotifications ?? false,
        pushNotifications: user?.preferences?.pushNotifications ?? true
      }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleInputChange = (e) => {
      const { name, value, checked } = e.target;
      if (name.startsWith('preferences.')) {
        const prefKey = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            [prefKey]: checked
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update profile');
        }

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        
        // Update the user context with new data if needed
        // You might want to update the auth context here
        
      } catch (error) {
        console.error('Profile update error:', error);
        setMessage({ 
          type: 'error', 
          text: error.message || 'Failed to update profile. Please try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    };

  return (
      <div className="space-y-6">
        <motion.div
          initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/30 p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center">
               <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3">
                 <FiUser className="h-5 w-5 text-white" />
               </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h3>
                <p className="text-sm text-gray-600">Manage your account information and preferences</p>
              </div>
            </div>
                         <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setIsEditing(!isEditing)}
               className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors duration-200 font-medium"
             >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </motion.button>
          </div>

          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
                             className={`p-4 rounded-xl mb-6 ${
                 message.type === 'success' 
                   ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                   : 'bg-red-50 text-red-800 border border-red-200'
               }`}
            >
              {message.text}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                     <input
                     type="text"
                     name="name"
                     value={formData.name}
                     onChange={handleInputChange}
                     disabled={!isEditing}
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Email Notifications</h5>
                    <p className="text-sm text-gray-600">Receive updates about your complaints via email</p>
                  </div>
                                     <label className="relative inline-flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       name="preferences.emailNotifications"
                       checked={formData.preferences.emailNotifications}
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="sr-only peer"
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 disabled:opacity-50"></div>
                   </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">SMS Notifications</h5>
                    <p className="text-sm text-gray-600">Receive urgent updates via text message</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="preferences.smsNotifications"
                      checked={formData.preferences.smsNotifications}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Push Notifications</h5>
                    <p className="text-sm text-gray-600">Receive real-time updates in your browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="preferences.pushNotifications"
                      checked={formData.preferences.pushNotifications}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div>
                    <h5 className="font-medium text-gray-900">Change Password</h5>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    Change
                  </motion.button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div>
                    <h5 className="font-medium text-gray-900">Two-Factor Authentication</h5>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                                     <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors duration-200 font-medium"
                   >
                     Enable
                   </motion.button>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-4 pt-6">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </motion.button>
                                 <motion.button
                   type="submit"
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   disabled={isLoading}
                   className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                 >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </motion.button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    );
  };

  return (
         <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex flex-col relative overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
       {/* Animated background elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
         
         {/* Floating particles */}
         <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}></div>
         <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4s' }}></div>
         <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-indigo-400/35 rounded-full animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '3.5s' }}></div>
         <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pink-400/30 rounded-full animate-bounce" style={{ animationDelay: '3.5s', animationDuration: '4.5s' }}></div>
       </div>
      {/* Header */}
      <header className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-dark-700/50 sticky top-0 z-40">
        <div 
          className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 lg:px-8"
          style={{
            paddingLeft: isLargeScreen ? '0px' : '1rem'
          }}
        >
          {/* Logo and Menu Button */}
          <div className="flex items-center"
               style={{
                 marginLeft: isLargeScreen ? '1rem' : '0'
               }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 lg:hidden"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center ml-4 lg:ml-3">
               <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaCity className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="ml-3">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">UrbanEye</span>
                <p className="text-xs text-gray-500 -mt-1 hidden sm:block">Smart Civic Management</p>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 relative">
              <FiBell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                                 <div className="h-8 w-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Citizen</p>
                </div>
                <FiChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50"
                  >
                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveTab('profile');
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <FiUser className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                    <button type="button" className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                      <FiSettings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    <hr className="my-2" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <FiLogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 lg:grid"
           style={{
             gridTemplateColumns: isLargeScreen ? `${sidebarCollapsed ? '80px' : '288px'} 1fr` : '1fr'
           }}>
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ 
            x: isLargeScreen ? 0 : (sidebarOpen ? 0 : -280),
            width: isLargeScreen ? (sidebarCollapsed ? 80 : 288) : 288
          }}
          transition={{ 
            duration: 0.4, 
            ease: [0.4, 0.0, 0.2, 1],
            width: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }
          }}
          className="fixed left-0 bottom-0 z-30 bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-dark-700/50 lg:relative lg:translate-x-0 lg:flex lg:flex-col lg:min-h-0 lg:col-start-1 lg:top-0 lg:z-auto"
          style={{
            top: isLargeScreen ? '0px' : '80px'
          }}
        >
          <div className="flex items-center justify-between h-16 sm:h-20 px-6 border-b border-gray-200/50 dark:border-dark-700/50 lg:hidden">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center">
                <FaCity className="text-white w-4 h-4" />
              </div>
              <span className="ml-3 text-lg font-bold text-gray-900">UrbanEye</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <nav className={`flex-1 py-6 overflow-y-auto ${isLargeScreen && sidebarCollapsed ? 'px-2' : 'px-6'}`}>
            <div className="space-y-2">
              {sidebarActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={action.onClick}
                  className={`w-full flex items-center space-x-3 py-3 rounded-2xl text-left transition-all duration-200 ${
                    isLargeScreen && sidebarCollapsed ? 'px-2 justify-center' : 'px-4'
                  } ${
                    activeTab === action.label.toLowerCase().replace(' ', '') 
                       ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700/50'
                  }`}
                >
                  <action.icon className="h-5 w-5" />
                  <motion.span 
                    className="font-medium"
                    animate={{ 
                      opacity: isLargeScreen && sidebarCollapsed ? 0 : 1,
                      x: isLargeScreen && sidebarCollapsed ? -10 : 0
                    }}
                    transition={{ 
                      duration: 0.3, 
                      ease: [0.4, 0.0, 0.2, 1],
                      delay: isLargeScreen && sidebarCollapsed ? 0 : 0.1
                    }}
                    style={{
                      display: isLargeScreen && sidebarCollapsed ? 'none' : 'block'
                    }}
                  >
                    {action.label}
                  </motion.span>
                </motion.button>
              ))}
            </div>
          </nav>

          <div className={`border-t border-gray-200/50 dark:border-dark-700/50 ${isLargeScreen && sidebarCollapsed ? 'p-2' : 'p-6'}`}>
                         <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-200">
              <div className="flex items-center mb-2">
                 <FaRegSmile className="h-5 w-5 text-violet-600 mr-2" />
                <motion.span 
                                     className="text-sm font-medium text-violet-800"
                  animate={{ 
                    opacity: isLargeScreen && sidebarCollapsed ? 0 : 1,
                    x: isLargeScreen && sidebarCollapsed ? -10 : 0
                  }}
                  transition={{ 
                    duration: 0.3, 
                    ease: [0.4, 0.0, 0.2, 1],
                    delay: isLargeScreen && sidebarCollapsed ? 0 : 0.1
                  }}
                  style={{
                    display: isLargeScreen && sidebarCollapsed ? 'none' : 'block'
                  }}
                >
                  Quick Tip
                </motion.span>
              </div>
              <motion.p 
                                 className="text-xs text-violet-700"
                animate={{ 
                  opacity: isLargeScreen && sidebarCollapsed ? 0 : 1,
                  x: isLargeScreen && sidebarCollapsed ? -10 : 0
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0.0, 0.2, 1],
                  delay: isLargeScreen && sidebarCollapsed ? 0 : 0.15
                }}
                style={{
                  display: isLargeScreen && sidebarCollapsed ? 'none' : 'block'
                }}
              >
                Your reports help make our city better. Keep up the great work! 🌟
              </motion.p>
            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-auto lg:col-start-2">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <EmailVerificationBanner />
            
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <OverviewTab />
                </motion.div>
              )}
              
              {activeTab === 'submit' && (
                <motion.div
                  key="submit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SubmitComplaintTab />
                </motion.div>
              )}
              
              {activeTab === 'complaints' && (
                <motion.div
                  key="complaints"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <MyComplaintsTab />
                </motion.div>
              )}
              
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnalyticsTab />
                </motion.div>
              )}
              
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProfileTab />
                </motion.div>
              )}
              
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SettingsPage />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-dark-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center mb-4">
                                 <div className="h-8 w-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mr-3">
                  <FaCity className="text-white w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">UrbanEye</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Empowering citizens to build smarter, better communities through civic engagement and digital innovation.
              </p>
              <div className="flex space-x-3">
                <button type="button" className="p-2 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors duration-200">
                  <FiMessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button type="button" className="p-2 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors duration-200">
                  <FiHeart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button type="button" className="p-2 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors duration-200">
                  <FiStar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">About Us</button></li>
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">How It Works</button></li>
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">Success Stories</button></li>
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">Contact Support</button></li>
              </ul>
            </div>
            
            <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">Help Center</button></li>
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">Community Guidelines</button></li>
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">Privacy Policy</button></li>
                <li><button type="button" className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200">Terms of Service</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Connect</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Stay updated with the latest civic improvements and community news.
              </p>
                             <button type="button" className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 text-sm hover:scale-105">
                Subscribe to Updates
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-200/50 dark:border-dark-700/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
              © 2024 UrbanEye. All rights reserved. Building better cities together.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Made with ❤️ for the community</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CitizenDashboard;