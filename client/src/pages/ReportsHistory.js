import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiEye,
  FiRefreshCw,
  FiTrendingUp,
  FiBarChart2,
  FiFileText,
  FiImage,
  FiTrash2,
  FiChevronDown,

  FiGrid,
  FiList,
  FiActivity
} from 'react-icons/fi';
import CitizenLayout from '../components/CitizenLayout';

const ReportsHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useAuth(); // Keep auth context active
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'newest');
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') || 'grid');

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
    const view = searchParams.get('view') || 'grid';

    if (search !== searchTerm) setSearchTerm(search);
    if (status !== statusFilter) setStatusFilter(status);
    if (category !== categoryFilter) setCategoryFilter(category);
    if (sort !== sortBy) setSortBy(sort);
    if (view !== viewMode) setViewMode(view);
  }, [searchParams, searchTerm, statusFilter, categoryFilter, sortBy, viewMode]);
  const [refreshing, setRefreshing] = useState(false);


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



  // Don't render anything if we're still loading or if reports is undefined
  if (loading || reports === undefined) {
    return (
      <CitizenLayout showRefresh={true} onRefresh={refreshReports}>
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
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout showRefresh={true} onRefresh={refreshReports}>
      <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">

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

          {/* Enhanced Stats Overview with Interactive Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8"
          >
            {/* Total Reports Card */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-white via-white to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              onClick={() => {
                setStatusFilter('all');
                updateURLParams({ status: 'all' });
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-[#52796F] transition-colors duration-300">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">All submissions</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[#84A98C]/40 transition-all duration-300 group-hover:scale-110">
                  <FiFileText className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <FiActivity className="h-3 w-3 mr-1" />
                <span>Click to view all</span>
              </div>
            </motion.div>

            {/* Resolved Reports Card */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-white via-white to-green-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              onClick={() => {
                setStatusFilter('resolved');
                updateURLParams({ status: 'resolved' });
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-[#52796F] group-hover:text-[#354F52] transition-colors duration-300">{stats.resolved}</p>
                  <p className="text-xs text-gray-500 mt-1">Successfully fixed</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-r from-green-500 to-[#52796F] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/40 transition-all duration-300 group-hover:scale-110">
                  <FiCheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <FiActivity className="h-3 w-3 mr-1" />
                <span>Click to filter</span>
              </div>
            </motion.div>

            {/* In Progress Card */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-white via-white to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              onClick={() => {
                setStatusFilter('in_progress');
                updateURLParams({ status: 'in_progress' });
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">Being worked on</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-110">
                  <FiRefreshCw className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <FiActivity className="h-3 w-3 mr-1" />
                <span>Click to filter</span>
              </div>
            </motion.div>

            {/* Pending Card */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-white via-white to-yellow-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              onClick={() => {
                setStatusFilter('pending');
                updateURLParams({ status: 'pending' });
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 group-hover:text-yellow-700 transition-colors duration-300">{stats.pending}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/40 transition-all duration-300 group-hover:scale-110">
                  <FiClock className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <FiActivity className="h-3 w-3 mr-1" />
                <span>Click to filter</span>
              </div>
            </motion.div>

            {/* Success Rate Card */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-white via-white to-teal-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-teal-600 group-hover:text-teal-700 transition-colors duration-300">{stats.resolutionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Resolution rate</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-teal-500/40 transition-all duration-300 group-hover:scale-110">
                  <FiTrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <FiBarChart2 className="h-3 w-3 mr-1" />
                <span>Performance metric</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Insights Panel */}
          {reports && reports.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-gradient-to-r from-[#CAD2C5]/20 via-white/80 to-[#84A98C]/20 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#2F3E46] mb-2">Quick Insights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/60 rounded-xl">
                      <p className="text-2xl font-bold text-[#52796F]">
                        {reports.filter(r => {
                          const daysDiff = Math.floor((new Date() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
                          return daysDiff <= 7;
                        }).length}
                      </p>
                      <p className="text-sm text-gray-600">This Week</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">
                        {reports.filter(r => r.status === 'in_progress').length}
                      </p>
                      <p className="text-sm text-gray-600">Active</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-xl">
                      <p className="text-2xl font-bold text-green-600">
                        {reports.filter(r => {
                          const daysDiff = Math.floor((new Date() - new Date(r.updatedAt || r.createdAt)) / (1000 * 60 * 60 * 24));
                          return daysDiff <= 3 && r.status === 'resolved';
                        }).length}
                      </p>
                      <p className="text-sm text-gray-600">Recently Resolved</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last Report</p>
                    <p className="font-semibold text-[#52796F]">
                      {reports.length > 0 ? getTimeAgo(reports[0].createdAt) : 'None'}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center">
                    <FiActivity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Filters and Search with View Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 mb-8"
          >
            <div className="flex flex-col space-y-4">
              {/* Top Row: Search and View Toggle */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Section */}
                <div className="flex-1">
                  <div className="relative group">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-[#52796F] transition-colors duration-200" />
                    <input
                      type="text"
                      placeholder="Search by title, description, location, or ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        updateURLParams({ search: e.target.value });
                      }}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/90 hover:bg-white text-base"
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

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => {
                      setViewMode('grid');
                      updateURLParams({ view: 'grid' });
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white text-[#52796F] shadow-sm' 
                        : 'text-gray-600 hover:text-[#52796F]'
                    }`}
                  >
                    <FiGrid className="h-4 w-4" />
                    <span className="text-sm font-medium">Grid</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('list');
                      updateURLParams({ view: 'list' });
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white text-[#52796F] shadow-sm' 
                        : 'text-gray-600 hover:text-[#52796F]'
                    }`}
                  >
                    <FiList className="h-4 w-4" />
                    <span className="text-sm font-medium">List</span>
                  </button>
                </div>
              </div>

              {/* Bottom Row: Filters */}
              <div className="flex flex-wrap gap-3">
                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      updateURLParams({ status: e.target.value });
                    }}
                    className="appearance-none px-4 py-3.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/90 hover:bg-white cursor-pointer min-w-[140px]"
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
                    className="appearance-none px-4 py-3.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/90 hover:bg-white cursor-pointer min-w-[160px]"
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
                    className="appearance-none px-4 py-3.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 bg-white/90 hover:bg-white cursor-pointer min-w-[140px]"
                  >
                    <option value="newest">📅 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
                    <option value="priority">⚡ Priority</option>
                    <option value="status">📊 Status</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setStatusFilter('pending');
                      updateURLParams({ status: 'pending' });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      statusFilter === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('in_progress');
                      updateURLParams({ status: 'in_progress' });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      statusFilter === 'in_progress'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('resolved');
                      updateURLParams({ status: 'resolved' });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      statusFilter === 'resolved'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    Resolved
                  </button>
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
                    <span className="text-sm font-medium">Clear All</span>
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
            {/* Enhanced Report Cards - Grid/List View */}
            <AnimatePresence>
              {viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => navigate(`/complaint-detail/${report.id}`)}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-6 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getCategoryIcon(report.category)}</span>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              #{report.id}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#52796F] transition-colors duration-300 line-clamp-2">
                            {report.title}
                          </h3>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[report.status]?.bgColor || 'bg-gray-100'} ${statusConfig[report.status]?.color || 'text-gray-600'} border ${statusConfig[report.status]?.borderColor || 'border-gray-200'}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{statusConfig[report.status]?.label || report.status}</span>
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityConfig[report.priority]?.bgColor || 'bg-gray-100'} ${priorityConfig[report.priority]?.color || 'text-gray-600'}`}>
                            {priorityConfig[report.priority]?.label || report.priority}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                        {report.description}
                      </p>

                      {/* Card Details */}
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{report.address}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center">
                            <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{getTimeAgo(report.createdAt)}</span>
                          </div>
                          {report.images && report.images.length > 0 && (
                            <div className="flex items-center">
                              <FiImage className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{report.images.length}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar for In Progress Reports */}
                        {report.status === 'in_progress' && report.progress && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Progress</span>
                              <span>{report.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-[#84A98C] to-[#52796F] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${report.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {categories?.find(cat => cat.value === report.category)?.label || report.category}
                        </span>
                        <div className="flex items-center text-xs text-[#52796F] font-medium">
                          <FiEye className="h-3 w-3 mr-1" />
                          View Details
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4, delay: index * 0.02 }}
                      whileHover={{ x: 4 }}
                      onClick={() => navigate(`/complaint-detail/${report.id}`)}
                      className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-[#84A98C]/30 p-4 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        {/* Left Section */}
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-gradient-to-br from-[#CAD2C5] to-[#84A98C] rounded-xl flex items-center justify-center">
                              <span className="text-lg">{getCategoryIcon(report.category)}</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#52796F] transition-colors duration-300 truncate">
                                {report.title}
                              </h3>
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                                #{report.id}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                              {report.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <FiMapPin className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[200px]">{report.address}</span>
                              </div>
                              <div className="flex items-center">
                                <FiCalendar className="h-3 w-3 mr-1" />
                                <span>{getTimeAgo(report.createdAt)}</span>
                              </div>
                              <div className="flex items-center">
                                <span>{categories?.find(cat => cat.value === report.category)?.label || report.category}</span>
                              </div>
                              {report.images && report.images.length > 0 && (
                                <div className="flex items-center">
                                  <FiImage className="h-3 w-3 mr-1" />
                                  <span>{report.images.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {/* Progress for In Progress Reports */}
                          {report.status === 'in_progress' && report.progress && (
                            <div className="hidden sm:flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-[#84A98C] to-[#52796F] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${report.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 w-8">{report.progress}%</span>
                            </div>
                          )}

                          {/* Priority Badge */}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityConfig[report.priority]?.bgColor || 'bg-gray-100'} ${priorityConfig[report.priority]?.color || 'text-gray-600'}`}>
                            {priorityConfig[report.priority]?.label || report.priority}
                          </span>

                          {/* Status Badge */}
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig[report.status]?.bgColor || 'bg-gray-100'} ${statusConfig[report.status]?.color || 'text-gray-600'} border ${statusConfig[report.status]?.borderColor || 'border-gray-200'}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1.5 hidden sm:inline">{statusConfig[report.status]?.label || report.status}</span>
                          </span>

                          {/* Action Button */}
                          <div className="flex items-center text-[#52796F] group-hover:text-[#354F52] transition-colors duration-300">
                            <FiEye className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
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


      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/report-issue')}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-full shadow-2xl hover:shadow-[#52796F]/30 transition-all duration-300 flex items-center justify-center z-50"
      >
        <span className="text-2xl font-bold">+</span>
      </motion.button>
      </div>
    </CitizenLayout>
  );
};

export default ReportsHistory;
