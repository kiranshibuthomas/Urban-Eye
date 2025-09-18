import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
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
          const statusOrder = { pending: 1, in_progress: 2, resolved: 3, closed: 4, deleted: 5 };
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
    navigate('/login');
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
      {/* Header */}
      <header className="relative bg-gradient-to-r from-white/98 via-[#CAD2C5]/30 to-white/98 backdrop-blur-xl border-b border-[#84A98C]/50 sticky top-0 z-50 shadow-sm">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#84A98C] rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-[#52796F] rounded-full blur-2xl"></div>
        </div>
        <div className="relative w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-4">
            {/* Back Button & Logo */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/citizen-dashboard')}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200"
              >
                <FiArrowLeft className="h-6 w-6 text-[#52796F]" />
                <span className="text-[#52796F] font-medium hidden sm:block">Back</span>
              </motion.button>
              
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-[#52796F] to-[#354F52] rounded-2xl flex items-center justify-center mr-4">
                  <FaCity className="text-white w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900">UrbanEye</span>
                  <p className="text-sm text-gray-500 -mt-1">My Reports</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              <button 
                onClick={() => navigate('/citizen-dashboard')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/report-issue')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                Report Issue
              </button>
              <button 
                onClick={() => navigate('/reports-history')}
                className="text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                My Reports
              </button>
            </nav>

            {/* User Menu & Actions */}
            <div className="flex items-center space-x-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshReports}
                disabled={refreshing}
                className="p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200 disabled:opacity-50"
                title="Refresh reports"
              >
                <FiRefreshCw className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              
            {/* User Menu Dropdown */}
            <div 
              className="relative user-menu-dropdown group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200"
              >
                  <div className="h-10 w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <FiUser className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-base font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">Citizen</p>
                  </div>
                  <FiChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
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
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      </div>
                      
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => navigate('/profile')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                        >
                          <FiUser className="h-4 w-4 mr-3" />
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/settings')}
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

      <div className="w-full px-4 lg:px-8 py-6">
        <div className="max-w-8xl mx-auto">
          
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-800">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <FiXCircle className="h-5 w-5" />
              </button>
            </motion.div>
          )}
          {/* Stats Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-3xl font-bold text-[#52796F]">{stats.resolved}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center">
                  <FiRefreshCw className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-3xl font-bold text-teal-600">{stats.resolutionRate}%</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="deleted">Archived</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Reports List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2F3E46]">
                Your Reports ({filteredReports.length})
              </h2>
              {filteredReports.length > 0 && (
                <div className="text-sm text-gray-500">
                  Showing {filteredReports.length} of {reports.length} reports
                </div>
              )}
            </div>
            <AnimatePresence>
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{report.title}</h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">{report.description}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityConfig[report.priority]?.bgColor || 'bg-gray-50'} ${priorityConfig[report.priority]?.color || 'text-gray-600'}`}>
                            {priorityConfig[report.priority]?.label || report.priority || 'Unknown'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[report.status]?.bgColor || 'bg-gray-50'} ${statusConfig[report.status]?.color || 'text-gray-600'} border ${statusConfig[report.status]?.borderColor || 'border-gray-200'}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{statusConfig[report.status]?.label || report.status || 'Unknown'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <span className="mr-1">{getCategoryIcon(report.category)}</span>
                          <span>{categories?.find(cat => cat.value === report.category)?.label || report.category || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          <span>{report.address}</span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 mr-1" />
                          <span>Submitted {getTimeAgo(report.createdAt)}</span>
                        </div>
                        {report.images && report.images.length > 0 && (
                          <div className="flex items-center">
                            <FiImage className="h-4 w-4 mr-1" />
                            <span>{report.images.length} photo{report.images.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {report.status === 'in_progress' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{report.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#84A98C] to-[#52796F] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${report.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Assigned To */}
                      {report.assignedTo && (
                        <div className="text-sm text-gray-600 mb-4">
                          <span className="font-medium">Assigned to:</span> {report.assignedTo}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          try {
                            const detailedReport = await fetchReportDetails(report.id);
                            setSelectedReport(detailedReport);
                          } catch (error) {
                            console.error('Error fetching report details:', error);
                            setSelectedReport(report); // Fallback to basic report data
                          }
                        }}
                        className="flex items-center justify-center px-4 py-2 bg-[#52796F] text-white rounded-xl hover:bg-[#354F52] transition-all duration-200 font-medium"
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
                        className="flex items-center justify-center px-3 py-2 bg-white border-2 border-[#84A98C] text-[#52796F] rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 font-medium"
                        title="View on Map"
                      >
                        <FiMap className="h-4 w-4" />
                      </motion.button>
                      
                      {report.status === 'resolved' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center px-4 py-2 border-2 border-[#84A98C]/50 text-[#52796F] rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 font-medium"
                        >
                          <FiThumbsUp className="h-4 w-4 mr-2" />
                          Rate
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredReports.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {(!reports || reports.length === 0) ? 'No reports yet' : 'No reports found'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {(!reports || reports.length === 0)
                    ? 'You haven\'t submitted any reports yet. Start by reporting an issue in your community.'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/report-issue')}
                    className="px-6 py-3 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-semibold"
                  >
                    Report New Issue
                  </motion.button>
                  {(!reports || reports.length === 0) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={refreshReports}
                      disabled={refreshing}
                      className="px-6 py-3 border-2 border-[#84A98C]/50 text-[#52796F] rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 font-semibold disabled:opacity-50"
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </motion.button>
                  )}
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
