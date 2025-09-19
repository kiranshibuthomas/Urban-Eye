import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleMapModal from '../components/GoogleMapModal';
import { 
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiEye,
  FiDownload,
  FiRefreshCw,
  FiTrendingUp,
  FiBarChart2,
  FiFileText,
  FiImage,
  FiMessageSquare,
  FiStar,
  FiThumbsUp,
  FiMap,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiTrash2
} from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';

const ReportsHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'newest');

  // Helper function to update URL parameters
  const updateURLParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'newest') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  // Sync filter states with URL parameters
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'newest';

    if (search !== searchTerm) setSearchTerm(search);
    if (status !== statusFilter) setStatusFilter(status);
    if (category !== categoryFilter) setCategoryFilter(category);
    if (sort !== sortBy) setSortBy(sort);
  }, [searchParams, searchTerm, statusFilter, categoryFilter, sortBy]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // API Functions
  const fetchUserReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/complaints/user?limit=100', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const complaints = data.complaints || [];
      
      // Ensure we have an array
      if (!Array.isArray(complaints)) {
        console.warn('API returned non-array data:', complaints);
        return [];
      }
      
      return complaints;
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  };

  const fetchReportDetails = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/complaints/${reportId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const complaint = data.complaint;
      
      // Ensure the complaint has the expected structure
      if (complaint) {
        return {
          ...complaint,
          images: complaint.images || [],
          comments: complaint.comments || [],
          statusHistory: complaint.statusHistory || []
        };
      }
      
      return complaint;
    } catch (error) {
      console.error('Error fetching report details:', error);
      throw error;
    }
  };

  const refreshReports = async () => {
    setRefreshing(true);
    try {
      const reportsData = await fetchUserReports();
      
      // Ensure each report has the expected structure
      const normalizedReports = reportsData.map(report => ({
        ...report,
        images: report.images || [],
        comments: report.comments || [],
        statusHistory: report.statusHistory || []
      }));
      
      setReports(normalizedReports);
      setFilteredReports(normalizedReports);
      setError(null);
    } catch (error) {
      setError('Failed to refresh reports. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const categories = [
    { value: 'road_issues', label: 'Road Issues', icon: '🛣️' },
    { value: 'water_supply', label: 'Water Supply', icon: '💧' },
    { value: 'electricity', label: 'Electricity', icon: '⚡' },
    { value: 'waste_management', label: 'Waste Management', icon: '🗑️' },
    { value: 'public_transport', label: 'Public Transport', icon: '🚌' },
    { value: 'parks_recreation', label: 'Parks & Recreation', icon: '🌳' },
    { value: 'street_lighting', label: 'Street Lighting', icon: '💡' },
    { value: 'drainage', label: 'Drainage', icon: '🌊' },
    { value: 'noise_pollution', label: 'Noise Pollution', icon: '🔊' },
    { value: 'air_pollution', label: 'Air Pollution', icon: '🌫️' },
    { value: 'safety_security', label: 'Safety & Security', icon: '🛡️' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const statusConfig = {
    pending: { 
      label: 'Pending', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      icon: FiClock 
    },
    in_progress: { 
      label: 'In Progress', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      icon: FiRefreshCw 
    },
    resolved: { 
      label: 'Resolved', 
      color: 'text-[#52796F]', 
      bgColor: 'bg-[#CAD2C5]/20', 
      borderColor: 'border-[#84A98C]/30',
      icon: FiCheckCircle 
    },
    rejected: { 
      label: 'Rejected', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      icon: FiXCircle 
    },
    closed: { 
      label: 'Closed', 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-50', 
      borderColor: 'border-gray-200',
      icon: FiXCircle 
    },
    deleted: { 
      label: 'Archived', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      icon: FiTrash2 
    }
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'text-[#52796F]', bgColor: 'bg-[#CAD2C5]/30' },
    medium: { label: 'Medium', color: 'text-[#84A98C]', bgColor: 'bg-[#CAD2C5]/20' },
    high: { label: 'High', color: 'text-[#354F52]', bgColor: 'bg-[#84A98C]/20' },
    urgent: { label: 'Urgent', color: 'text-[#2F3E46]', bgColor: 'bg-[#52796F]/20' }
  };

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const reportsData = await fetchUserReports();
        
        // Ensure each report has the expected structure
        const normalizedReports = reportsData.map(report => ({
          ...report,
          images: report.images || [],
          comments: report.comments || [],
          statusHistory: report.statusHistory || []
        }));
        
        setReports(normalizedReports);
        setFilteredReports(normalizedReports);
      } catch (error) {
        setError('Failed to load reports. Please try again.');
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    if (!reports || !Array.isArray(reports)) {
      setFilteredReports([]);
      return;
    }

    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(report => report.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          const statusOrder = { pending: 1, in_progress: 2, resolved: 3, rejected: 4, closed: 5, deleted: 6 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, categoryFilter, sortBy]);

  const getStatusIcon = (status) => {
    const IconComponent = statusConfig[status]?.icon || FiAlertCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryIcon = (category) => {
    const categoryData = categories?.find(cat => cat.value === category);
    return categoryData?.icon || '📋';
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

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  const getStats = () => {
    if (!reports || !Array.isArray(reports)) {
      return {
        total: 0,
        resolved: 0,
        inProgress: 0,
        pending: 0,
        resolutionRate: 0
      };
    }

    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const inProgress = reports.filter(r => r.status === 'in_progress').length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, resolved, inProgress, pending, resolutionRate };
  };

  const stats = getStats();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true, state: {} });
  };

  // Handle hover-based dropdown behavior
  const handleMouseEnter = () => {
    console.log('Mouse entered dropdown area');
    setUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    console.log('Mouse left dropdown area');
    setUserMenuOpen(false);
  };

  // Don't render anything if we're still loading or if reports is undefined
  if (loading || reports === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#52796F] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reports...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">
      {/* Enhanced Header */}
      <header className="relative bg-gradient-to-r from-white/98 via-[#CAD2C5]/30 to-white/98 backdrop-blur-xl border-b border-[#84A98C]/50 sticky top-0 z-50 shadow-sm">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-[#84A98C]/10 to-[#52796F]/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -top-2 -right-2 w-32 h-32 bg-gradient-to-br from-[#CAD2C5]/10 to-[#84A98C]/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 py-3 sm:py-4">
            {/* Left Section - Back Button & Logo */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/citizen-dashboard')}
                className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 group"
              >
                <FiArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-[#52796F] group-hover:text-[#354F52]" />
                <span className="text-[#52796F] font-medium hidden sm:block group-hover:text-[#354F52]">Back</span>
              </motion.button>
              
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-[#52796F] to-[#354F52] rounded-2xl flex items-center justify-center shadow-lg">
                  <FaCity className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">UrbanEye</h1>
                  <p className="text-xs sm:text-sm text-gray-500 -mt-1">My Reports</p>
                </div>
              </div>
            </div>

            {/* Center Section - Navigation (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-8">
              <motion.button 
                whileHover={{ y: -1 }}
                onClick={() => navigate('/citizen-dashboard')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#52796F] transition-all duration-200 group-hover:w-full"></span>
              </motion.button>
              <motion.button 
                whileHover={{ y: -1 }}
                onClick={() => navigate('/report-issue')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base relative group"
              >
                Report Issue
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#52796F] transition-all duration-200 group-hover:w-full"></span>
              </motion.button>
              <motion.button 
                whileHover={{ y: -1 }}
                onClick={() => navigate('/reports-history')}
                className="text-[#52796F] font-semibold transition-colors duration-200 text-base relative"
              >
                My Reports
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#52796F]"></span>
              </motion.button>
            </nav>

            {/* Right Section - Actions & User Menu */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshReports}
                disabled={refreshing}
                className="p-2 sm:p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200 disabled:opacity-50 group"
                title="Refresh reports"
              >
                <FiRefreshCw className={`h-5 w-5 sm:h-6 sm:w-6 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
              </motion.button>
              
              {/* User Menu */}
              <div 
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 group"
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <FiUser className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm sm:text-base font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">Citizen</p>
                  </div>
                  <FiChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                
                {/* Enhanced Dropdown Menu */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#84A98C]/30 py-2 z-50"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="px-4 py-3 border-b border-[#84A98C]/20">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">Citizen Account</p>
                      </div>
                      
                      <div className="py-1">
                        <motion.button
                          whileHover={{ x: 4 }}
                          type="button"
                          onClick={() => navigate('/profile')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#CAD2C5]/20 flex items-center transition-all duration-200"
                        >
                          <FiUser className="h-4 w-4 mr-3 text-[#52796F]" />
                          Profile Settings
                        </motion.button>
                        <motion.button
                          whileHover={{ x: 4 }}
                          type="button"
                          onClick={() => navigate('/settings')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#CAD2C5]/20 flex items-center transition-all duration-200"
                        >
                          <FiSettings className="h-4 w-4 mr-3 text-[#52796F]" />
                          Preferences
                        </motion.button>
                      </div>
                      
                      <div className="border-t border-[#84A98C]/20 pt-1">
                        <motion.button
                          whileHover={{ x: 4 }}
                          type="button"
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-all duration-200"
                        >
                          <FiLogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </motion.button>
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100/50 transition-colors duration-200"
              >
                <FiXCircle className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* Enhanced Stats Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
          >
            {/* Total Reports Card */}
            <motion.div 
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-[#52796F] transition-colors duration-300">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">All time submissions</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[#84A98C]/30 transition-shadow duration-300">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Resolved Reports Card */}
            <motion.div 
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-[#52796F] group-hover:text-[#354F52] transition-colors duration-300">{stats.resolved}</p>
                  <p className="text-xs text-gray-500 mt-1">Successfully fixed</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[#84A98C]/30 transition-shadow duration-300">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            {/* In Progress Card */}
            <motion.div 
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently being worked on</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[#84A98C]/30 transition-shadow duration-300">
                  <FiRefreshCw className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Resolution Rate Card */}
            <motion.div 
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-teal-600 group-hover:text-teal-700 transition-colors duration-300">{stats.resolutionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Resolution efficiency</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[#84A98C]/30 transition-shadow duration-300">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Filters and Search */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 mb-8"
          >
            <div className="flex flex-col xl:flex-row gap-4">
              {/* Search Section */}
              <div className="flex-1">
                <div className="relative group">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-[#52796F] transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Search by title, description, or location..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      updateURLParams({ search: e.target.value });
                    }}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/80 hover:bg-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        updateURLParams({ search: '' });
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <FiXCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Section */}
              <div className="flex flex-wrap gap-3">
                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      updateURLParams({ status: e.target.value });
                    }}
                    className="appearance-none px-4 py-3.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/80 hover:bg-white cursor-pointer min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">🔄 In Progress</option>
                    <option value="resolved">✅ Resolved</option>
                    <option value="rejected">❌ Rejected</option>
                    <option value="closed">🔒 Closed</option>
                    <option value="deleted">🗄️ Archived</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      updateURLParams({ category: e.target.value });
                    }}
                    className="appearance-none px-4 py-3.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/80 hover:bg-white cursor-pointer min-w-[160px]"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>

                {/* Sort Filter */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      updateURLParams({ sort: e.target.value });
                    }}
                    className="appearance-none px-4 py-3.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/80 hover:bg-white cursor-pointer min-w-[140px]"
                  >
                    <option value="newest">📅 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
                    <option value="priority">⚡ Priority</option>
                    <option value="status">📊 Status</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'newest') && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setSortBy('newest');
                      updateURLParams({ search: '', status: 'all', category: 'all', sort: 'newest' });
                    }}
                    className="px-4 py-3.5 border border-gray-300 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 text-gray-600 hover:text-[#52796F] flex items-center space-x-2"
                  >
                    <FiXCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Clear</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Enhanced Reports List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Enhanced Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center">
                  <FiFileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#2F3E46]">
                    Your Reports
                  </h2>
                  <p className="text-sm text-gray-600">
                    {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
                    {filteredReports.length !== reports.length && ` of ${reports.length} total`}
                  </p>
                </div>
              </div>
              
              {filteredReports.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500 bg-[#CAD2C5]/30 px-3 py-2 rounded-lg">
                    <span className="font-medium">{filteredReports.length}</span> results
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/report-issue')}
                    className="px-4 py-2 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-medium text-sm flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>New Report</span>
                  </motion.button>
                </div>
              )}
            </div>
            {/* Enhanced Report Cards */}
            <AnimatePresence>
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                      {/* Header with Title and Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#52796F] transition-colors duration-300">
                            {report.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                        
                        {/* Status and Priority Badges */}
                        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${priorityConfig[report.priority]?.bgColor || 'bg-gray-100'} ${priorityConfig[report.priority]?.color || 'text-gray-600'}`}>
                            {priorityConfig[report.priority]?.label || report.priority || 'Unknown'}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig[report.status]?.bgColor || 'bg-gray-100'} ${statusConfig[report.status]?.color || 'text-gray-600'} border ${statusConfig[report.status]?.borderColor || 'border-gray-200'}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1.5">{statusConfig[report.status]?.label || report.status || 'Unknown'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Report Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2 text-lg">{getCategoryIcon(report.category)}</span>
                          <span className="font-medium">{categories?.find(cat => cat.value === report.category)?.label || report.category || 'Unknown'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{report.address}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{getTimeAgo(report.createdAt)}</span>
                        </div>
                        
                        {report.images && report.images.length > 0 && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FiImage className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{report.images.length} photo{report.images.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar for In Progress Reports */}
                      {report.status === 'in_progress' && report.progress && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span className="font-medium">Progress</span>
                            <span className="font-semibold">{report.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${report.progress}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="bg-gradient-to-r from-[#84A98C] to-[#52796F] h-2.5 rounded-full"
                            ></motion.div>
                          </div>
                        </div>
                      )}

                      {/* Assigned To */}
                      {report.assignedTo && (
                        <div className="flex items-center text-sm text-gray-600 bg-[#CAD2C5]/20 rounded-lg p-3">
                          <FiUser className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium">Assigned to:</span>
                          <span className="ml-1">{report.assignedTo}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-[200px]">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          try {
                            const detailedReport = await fetchReportDetails(report.id);
                            setSelectedReport(detailedReport);
                          } catch (error) {
                            console.error('Error fetching report details:', error);
                            setSelectedReport(report);
                          }
                        }}
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-medium shadow-lg hover:shadow-[#84A98C]/30"
                      >
                        <FiEye className="h-4 w-4 mr-2" />
                        View Details
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedReport(report);
                          setShowMap(true);
                        }}
                        className="flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-[#CAD2C5]/20 hover:border-[#52796F] hover:text-[#52796F] transition-all duration-200 font-medium"
                        title="View on Map"
                      >
                        <FiMap className="h-4 w-4 mr-2" />
                        View Map
                      </motion.button>
                      
                      {report.status === 'resolved' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center px-4 py-3 border-2 border-[#84A98C]/50 text-[#52796F] rounded-xl hover:bg-[#CAD2C5]/20 hover:border-[#52796F] transition-all duration-200 font-medium"
                        >
                          <FiThumbsUp className="h-4 w-4 mr-2" />
                          Rate Service
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Enhanced Empty State */}
            {filteredReports.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="max-w-md mx-auto">
                  <div className="h-32 w-32 bg-gradient-to-br from-[#CAD2C5]/50 to-[#84A98C]/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <FiFileText className="h-16 w-16 text-gray-400" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-[#2F3E46] mb-3">
                    {(!reports || reports.length === 0) ? 'No reports yet' : 'No reports found'}
                  </h3>
                  
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {(!reports || reports.length === 0)
                      ? 'You haven\'t submitted any reports yet. Start by reporting an issue in your community to make a difference.'
                      : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                    }
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/report-issue')}
                      className="px-8 py-4 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-semibold shadow-lg hover:shadow-[#84A98C]/30 flex items-center justify-center space-x-2"
                    >
                      <span>+</span>
                      <span>Report New Issue</span>
                    </motion.button>
                    
                    {(!reports || reports.length === 0) && (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={refreshReports}
                        disabled={refreshing}
                        className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-[#CAD2C5]/20 hover:border-[#52796F] hover:text-[#52796F] transition-all duration-200 font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                      </motion.button>
                    )}
                  </div>
                  
                  {/* Additional Help Text */}
                  <div className="mt-8 p-4 bg-[#CAD2C5]/20 rounded-xl">
                    <p className="text-sm text-gray-600">
                      <strong>Need help?</strong> Check out our{' '}
                      <button className="text-[#52796F] hover:text-[#354F52] underline">
                        reporting guidelines
                      </button>{' '}
                      or{' '}
                      <button className="text-[#52796F] hover:text-[#354F52] underline">
                        contact support
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#52796F] to-[#354F52] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <FiFileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Report Details</h2>
                      <p className="text-white/80 text-sm">Issue #{selectedReport.id?.slice(-8) || 'N/A'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-3 hover:bg-white/20 rounded-2xl transition-colors duration-200"
                  >
                    <FiXCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                <div className="p-8 space-y-8">
                {/* Report Info */}
                <div className="bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-2xl p-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-[#2F3E46] mb-3">{selectedReport.title}</h3>
                    <p className="text-[#354F52] text-lg leading-relaxed">{selectedReport.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/60 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#354F52] mb-2">Status</label>
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold ${statusConfig[selectedReport.status]?.bgColor || 'bg-gray-50'} ${statusConfig[selectedReport.status]?.color || 'text-gray-600'} border ${statusConfig[selectedReport.status]?.borderColor || 'border-gray-200'}`}>
                        {getStatusIcon(selectedReport.status)}
                        <span className="ml-2">{statusConfig[selectedReport.status]?.label || selectedReport.status || 'Unknown'}</span>
                      </span>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#354F52] mb-2">Priority</label>
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold ${priorityConfig[selectedReport.priority]?.bgColor || 'bg-gray-50'} ${priorityConfig[selectedReport.priority]?.color || 'text-gray-600'}`}>
                        {priorityConfig[selectedReport.priority]?.label || selectedReport.priority || 'Unknown'}
                      </span>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#354F52] mb-2">Category</label>
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#CAD2C5]/30 text-[#354F52]">
                        <span className="mr-2">{getCategoryIcon(selectedReport.category)}</span>
                        {categories?.find(cat => cat.value === selectedReport.category)?.label || selectedReport.category || 'Unknown'}
                      </span>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#354F52] mb-2">Submitted</label>
                      <span className="text-[#2F3E46] font-medium">{formatDate(selectedReport.createdAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#354F52] mb-2">Location</label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-[#2F3E46] flex-1">
                          <FiMapPin className="h-5 w-5 mr-2 text-[#52796F]" />
                          <span className="font-medium">{selectedReport.address}, {selectedReport.city} - {selectedReport.pincode}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowMap(true)}
                          className="ml-3 px-3 py-2 bg-gradient-to-r from-[#84A98C] to-[#52796F] text-white rounded-lg hover:from-[#52796F] hover:to-[#354F52] transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                        >
                          <FiMap className="h-4 w-4" />
                          <span>View Map</span>
                        </motion.button>
                      </div>
                    </div>

                    {selectedReport.assignedTo && (
                      <div className="bg-white/60 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-[#354F52] mb-2">Assigned To</label>
                        <span className="text-[#2F3E46] font-medium">{selectedReport.assignedTo}</span>
                      </div>
                    )}

                    {selectedReport.estimatedResolution && (
                      <div className="bg-white/60 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-[#354F52] mb-2">Estimated Resolution</label>
                        <span className="text-[#2F3E46] font-medium">{formatDate(selectedReport.estimatedResolution)}</span>
                      </div>
                    )}
                  </div>
                </div>
                </div>

                {/* Progress */}
                {selectedReport.status === 'in_progress' && (
                  <div className="bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-2xl p-6">
                    <label className="block text-sm font-semibold text-[#354F52] mb-4">Progress</label>
                    <div className="w-full bg-white/60 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-[#84A98C] to-[#52796F] h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedReport.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-[#2F3E46] font-medium">{selectedReport.progress}% complete</p>
                  </div>
                )}

                {/* Images */}
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div className="bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-2xl p-6">
                    <label className="block text-sm font-semibold text-[#354F52] mb-4">Photos ({selectedReport.images.length})</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedReport.images.map((image, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                          onClick={() => window.open(image.url, '_blank')}
                        >
                          <img 
                            src={image.url} 
                            alt={`Report photo ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center" style={{ display: 'none' }}>
                            <div className="text-center">
                              <FiImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Image not available</p>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <FiEye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedReport.comments && selectedReport.comments.length > 0 && (
                  <div className="bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-2xl p-6">
                    <label className="block text-sm font-semibold text-[#354F52] mb-4">Updates & Comments</label>
                    <div className="space-y-4">
                      {selectedReport.comments.map((comment, index) => (
                        <div key={index} className="bg-white/60 rounded-xl p-4 border border-[#84A98C]/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">{comment.author?.charAt(0) || 'A'}</span>
                              </div>
                              <span className="font-semibold text-[#2F3E46]">{comment.author}</span>
                            </div>
                            <span className="text-sm text-[#354F52]">{formatDate(comment.timestamp)}</span>
                          </div>
                          <p className="text-[#354F52] leading-relaxed">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedReport.status === 'rejected' && selectedReport.rejectionReason && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                    <label className="block text-sm font-semibold text-red-800 mb-4">Reason for Rejection</label>
                    <div className="bg-white/60 rounded-xl p-4 border border-red-200">
                      <p className="text-red-700 leading-relaxed">{selectedReport.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#CAD2C5]/20 border-t border-[#84A98C]/30 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center">
                      <FiFileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[#354F52] font-medium">Report #{selectedReport.id?.slice(-8) || 'N/A'}</p>
                      <p className="text-[#354F52] text-sm">Last updated: {formatDate(selectedReport.updatedAt || selectedReport.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white/60 text-[#354F52] rounded-xl hover:bg-white/80 transition-colors duration-200 font-medium"
                    >
                      <FiDownload className="h-4 w-4 mr-2 inline" />
                      Print
                    </button>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="px-6 py-2 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Modal */}
      {selectedReport && (
        <GoogleMapModal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          latitude={selectedReport.location?.coordinates?.[1] || selectedReport.latitude}
          longitude={selectedReport.location?.coordinates?.[0] || selectedReport.longitude}
          address={`${selectedReport.address}, ${selectedReport.city} - ${selectedReport.pincode}`}
          title={selectedReport.title}
        />
      )}
    </div>
  );
};

export default ReportsHistory;
