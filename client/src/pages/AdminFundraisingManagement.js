import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaEdit, 
  FaEye, 
  FaUsers, 
  FaRupeeSign, 
  FaClock,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaStop
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateCampaignModal from '../components/CreateCampaignModal';

const AdminFundraisingManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRaised: 0,
    totalDonors: 0
  });

  const statusOptions = [
    { value: '', label: 'All Campaigns' },
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, [searchTerm, selectedStatus, currentPage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        admin: 'true'
      });

      if (searchTerm) params.append('search', searchTerm);
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

  const fetchStats = async () => {
    try {
      // This would be a separate endpoint for admin stats
      // For now, we'll calculate from the campaigns data
      const response = await axios.get('/fundraising/campaigns?limit=1000&admin=true');
      const allCampaigns = response.data.campaigns;
      
      const totalRaised = allCampaigns.reduce((sum, campaign) => sum + campaign.raisedAmount, 0);
      const totalDonors = allCampaigns.reduce((sum, campaign) => sum + campaign.donorCount, 0);
      
      setStats({
        totalCampaigns: allCampaigns.length,
        activeCampaigns: allCampaigns.filter(c => c.status === 'active').length,
        totalRaised,
        totalDonors
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateCampaignStatus = async (campaignId, newStatus) => {
    try {
      await axios.put(`/fundraising/campaigns/${campaignId}`, {
        status: newStatus
      });
      
      toast.success(`Campaign ${newStatus} successfully`);
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Failed to update campaign status');
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

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
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

  if (loading && campaigns.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fundraising Management</h1>
            <p className="text-gray-600 mt-2">Manage public fundraising campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Campaign
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaPlay className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaRupeeSign className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Raised</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRaised)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaUsers className="text-orange-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Donors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDonors}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => {
                  const progressPercentage = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
                  const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                  
                  return (
                    <tr key={campaign._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <h3 className="text-sm font-medium text-gray-900 mr-2">
                                {campaign.title}
                              </h3>
                              {campaign.isUrgent && (
                                <FaExclamationTriangle className="text-red-500 text-xs" />
                              )}
                            </div>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(campaign.category)}`}>
                              {campaign.category.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status.toUpperCase()}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="w-full">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{formatCurrency(campaign.raisedAmount)}</span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Goal: {formatCurrency(campaign.targetAmount)}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {campaign.donorCount}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(campaign.endDate)}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <FaClock className="mr-1" />
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/fundraising/${campaign._id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Campaign"
                          >
                            <FaEye />
                          </Link>
                          
                          <Link
                            to={`/admin/fundraising/edit/${campaign._id}`}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Edit Campaign"
                          >
                            <FaEdit />
                          </Link>
                          
                          {/* Status Actions */}
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => updateCampaignStatus(campaign._id, 'active')}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Activate Campaign"
                            >
                              <FaPlay />
                            </button>
                          )}
                          
                          {campaign.status === 'active' && (
                            <button
                              onClick={() => updateCampaignStatus(campaign._id, 'paused')}
                              className="text-yellow-600 hover:text-yellow-900 p-1"
                              title="Pause Campaign"
                            >
                              <FaPause />
                            </button>
                          )}
                          
                          {campaign.status === 'paused' && (
                            <button
                              onClick={() => updateCampaignStatus(campaign._id, 'active')}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Resume Campaign"
                            >
                              <FaPlay />
                            </button>
                          )}
                          
                          {(campaign.status === 'active' || campaign.status === 'paused') && (
                            <button
                              onClick={() => updateCampaignStatus(campaign._id, 'cancelled')}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Cancel Campaign"
                            >
                              <FaStop />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No campaigns found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCampaigns();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default AdminFundraisingManagement;