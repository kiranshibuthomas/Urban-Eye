import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiTrendingUp, 
  FiMapPin, 
  FiRefreshCw,
  FiGrid,
  FiList,
  FiGlobe,
  FiUsers,
  FiEye,
  FiThumbsUp
} from 'react-icons/fi';
import PublicComplaintCard from '../components/PublicComplaintCard';
import LoadingSpinner from '../components/LoadingSpinner';
import publicFeedService from '../services/publicFeedService';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import toast from 'react-hot-toast';
import CitizenHeader from '../components/CitizenHeader';

const PublicFeedPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { logout: sessionLogout } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priority: '',
    sortBy: 'recent',
    city: '',
    ward: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [stats, setStats] = useState(null);

  // Category options
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'road_issues', label: 'Road Issues' },
    { value: 'water_supply', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'waste_management', label: 'Waste Management' },
    { value: 'public_transport', label: 'Public Transport' },
    { value: 'parks_recreation', label: 'Parks & Recreation' },
    { value: 'street_lighting', label: 'Street Lighting' },
    { value: 'drainage', label: 'Drainage' },
    { value: 'noise_pollution', label: 'Noise Pollution' },
    { value: 'air_pollution', label: 'Air Pollution' },
    { value: 'safety_security', label: 'Safety & Security' },
    { value: 'other', label: 'Other' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const sortOptions = [
    { value: 'hot', label: '🔥 Hot' },
    { value: 'recent', label: '🆕 New' },
    { value: 'most_upvoted', label: '⬆️ Top' },
    { value: 'most_viewed', label: '👁️ Rising' },
    { value: 'oldest', label: '📅 Old' }
  ];

  // Fetch complaints
  const fetchComplaints = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await publicFeedService.getPublicFeed(params);

      if (response.success) {
        if (page === 1) {
          setComplaints(response.complaints);
        } else {
          setComplaints(prev => [...prev, ...response.complaints]);
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.limit]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await publicFeedService.getPublicFeedStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchComplaints(1);
    fetchStats();
  }, [fetchComplaints, fetchStats]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchComplaints(1);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      priority: '',
      sortBy: 'recent',
      city: '',
      ward: ''
    });
  };

  // Load more complaints
  const loadMore = () => {
    if (pagination.current < pagination.pages) {
      fetchComplaints(pagination.current + 1);
    }
  };

  // Handle vote update
  const handleVoteUpdate = (complaintId, voteData) => {
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, ...voteData }
          : complaint
      )
    );
  };

  // Refresh data
  const handleRefresh = () => {
    fetchComplaints(1, true);
    fetchStats();
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[#84A98C]/30 border-t-[#52796F] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading public feed...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CitizenHeader onRefresh={handleRefresh} showRefresh={true} />

      {/* Main Content */}
      <main className="relative">
        {/* Search and Filters */}
        <div className="w-full px-4 lg:px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-gray-300 rounded p-4 mb-4 max-w-4xl mx-auto"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search r/CivicIssues"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex items-center gap-3">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  title="Sort by: Hot (trending), New (recent), Top (most upvoted), Rising (most viewed), Old (oldest first)"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-all duration-200 bg-white font-medium"
                >
                  <FiFilter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>

                {/* View mode toggle */}
                <div className="flex border border-gray-300 rounded overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-all duration-200 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    title="Card view"
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-all duration-200 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    title="Compact view"
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-6 border-t border-[#84A98C]/20"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-full px-4 py-3 border border-[#84A98C]/30 rounded-xl focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] bg-white/70 backdrop-blur-sm"
                      >
                        {categories.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="w-full px-4 py-3 border border-[#84A98C]/30 rounded-xl focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] bg-white/70 backdrop-blur-sm"
                      >
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="Enter city name"
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        className="w-full px-4 py-3 border border-[#84A98C]/30 rounded-xl focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ward/Area
                      </label>
                      <input
                        type="text"
                        placeholder="Enter ward or area"
                        value={filters.ward}
                        onChange={(e) => handleFilterChange('ward', e.target.value)}
                        className="w-full px-4 py-3 border border-[#84A98C]/30 rounded-xl focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={applyFilters}
                      className="px-6 py-3 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-medium"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 border border-[#84A98C]/30 text-gray-700 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <p className="text-gray-700 font-medium">
              Showing {complaints.length} of {pagination.total} complaints
            </p>
            
            {/* Active filters */}
            {(filters.category || filters.priority || filters.search || filters.city || filters.ward) && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-gray-500">Active filters:</span>
                {filters.category && (
                  <span className="px-3 py-1 bg-[#52796F]/10 text-[#52796F] rounded-full border border-[#52796F]/20">
                    {categories.find(c => c.value === filters.category)?.label}
                  </span>
                )}
                {filters.priority && (
                  <span className="px-3 py-1 bg-[#84A98C]/10 text-[#84A98C] rounded-full border border-[#84A98C]/20">
                    {priorityOptions.find(p => p.value === filters.priority)?.label}
                  </span>
                )}
                {filters.search && (
                  <span className="px-3 py-1 bg-[#CAD2C5]/20 text-[#354F52] rounded-full border border-[#CAD2C5]/40">
                    "{filters.search}"
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* Complaints Grid/List */}
          {complaints.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-4xl mx-auto"
              >
                {complaints.map((complaint, index) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <PublicComplaintCard
                      complaint={complaint}
                      onVoteUpdate={handleVoteUpdate}
                      compact={viewMode === 'list'}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Load More */}
              {pagination.current < pagination.pages && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={loadMore}
                    className="px-8 py-4 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-2xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Load More Complaints
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center py-16"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-[#84A98C]/20">
                <FiMapPin className="w-20 h-20 text-[#84A98C]/40 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No complaints found</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No public complaints have been reported yet. Be the first to contribute to your community!'
                  }
                </p>
                {!Object.values(filters).some(f => f) && (
                  <button
                    onClick={() => navigate('/report-issue')}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-xl hover:from-[#354F52] hover:to-[#2F3E46] transition-all duration-200 font-medium"
                  >
                    Report an Issue
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicFeedPage;