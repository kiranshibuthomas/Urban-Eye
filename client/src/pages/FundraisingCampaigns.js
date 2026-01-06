import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiHeart, 
  FiUsers, 
  FiClock, 
  FiMapPin,
  FiTarget,
  FiTrendingUp,
  FiCalendar,
  FiChevronDown,
  FiRefreshCw
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import CitizenLayout from '../components/CitizenLayout';

const FundraisingCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'environment', label: 'Environment' },
    { value: 'social_welfare', label: 'Social Welfare' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active Campaigns' },
    { value: 'completed', label: 'Completed Campaigns' },
    { value: '', label: 'All Campaigns' }
  ];

  useEffect(() => {
    fetchCampaigns();
  }, [searchTerm, selectedCategory, selectedStatus, currentPage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await axios.get(`/fundraising/campaigns?${params}`);
      setCampaigns(response.data.campaigns);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      infrastructure: 'bg-blue-100 text-blue-800',
      education: 'bg-green-100 text-green-800',
      healthcare: 'bg-red-100 text-red-800',
      environment: 'bg-emerald-100 text-emerald-800',
      social_welfare: 'bg-purple-100 text-purple-800',
      emergency: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const CampaignCard = ({ campaign }) => {
    const progressPercentage = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
    const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)));

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
        {campaign.images && campaign.images.length > 0 && (
          <div className="h-48 bg-gray-100 overflow-hidden">
            <img
              src={campaign.images[0]}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#52796F] transition-colors duration-200">
                {campaign.title}
              </h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(campaign.category)}`}>
                {categories.find(c => c.value === campaign.category)?.label || campaign.category}
              </span>
            </div>
            {campaign.isUrgent && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium ml-2">
                Urgent
              </span>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {campaign.description}
          </p>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(campaign.raisedAmount)} raised
              </span>
              <span className="text-sm text-gray-500">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#52796F] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>Goal: {formatCurrency(campaign.targetAmount)}</span>
              <span className="flex items-center">
                <FiUsers className="mr-1 h-3 w-3" />
                {campaign.donorCount} donors
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <FiClock className="mr-1 h-3 w-3" />
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Campaign ended'}
            </div>
            {campaign.location?.address && (
              <div className="flex items-center">
                <FiMapPin className="mr-1 h-3 w-3" />
                <span className="truncate max-w-24">{campaign.location.address}</span>
              </div>
            )}
          </div>

          <Link
            to={`/fundraising/${campaign._id}`}
            className="w-full bg-[#52796F] text-white py-3 px-4 rounded-xl hover:bg-[#354F52] transition-colors duration-200 flex items-center justify-center font-medium"
          >
            <FiHeart className="mr-2 h-4 w-4" />
            Donate Now
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <CitizenLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner />
        </motion.div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="min-h-screen bg-gray-50">
      
      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Public Fundraising Campaigns
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Support community projects and make a difference in your city. Every contribution counts!
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-[#52796F] rounded-xl flex items-center justify-center mr-4">
                  <FiTarget className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                  <p className="text-sm text-gray-600">Active Campaigns</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(campaigns.reduce((sum, c) => sum + c.raisedAmount, 0))}
                  </p>
                  <p className="text-sm text-gray-600">Total Raised</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaigns.reduce((sum, c) => sum + c.donorCount, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Donors</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <FiCalendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaigns.filter(c => {
                      const daysLeft = Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                      return daysLeft > 0 && daysLeft <= 7;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">Ending Soon</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 appearance-none bg-white"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedStatus('active');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 bg-[#52796F] text-white rounded-xl hover:bg-[#354F52] transition-colors duration-200 flex items-center justify-center font-medium"
              >
                <FiRefreshCw className="mr-2 h-4 w-4" />
                Clear Filters
              </button>
            </div>
          </motion.div>

          {/* Campaigns Grid */}
          <div>
            {campaigns.length > 0 ? (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                >
                  {campaigns.map((campaign, index) => (
                    <motion.div
                      key={campaign._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <CampaignCard campaign={campaign} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center items-center space-x-2"
                  >
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-6 py-3 bg-white border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                    >
                      Previous
                    </button>
                    
                    <span className="px-6 py-3 text-gray-700 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-6 py-3 bg-white border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                    >
                      Next
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center py-16 bg-white rounded-2xl border border-gray-200"
              >
                <FiHeart className="mx-auto text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No fundraising campaigns are currently available.'
                  }
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      </div>
    </CitizenLayout>
  );
};

export default FundraisingCampaigns;