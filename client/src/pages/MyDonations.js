import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import CitizenHeader from '../components/CitizenHeader';
import { 
  FiHeart, 
  FiCalendar, 
  FiFileText, 
  FiEye,
  FiDownload,
  FiTrendingUp,
  FiGift,
  FiTarget,
  FiUsers
} from 'react-icons/fi';

const MyDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonated, setTotalDonated] = useState(0);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    campaignsSupported: 0,
    averageDonation: 0
  });

  useEffect(() => {
    fetchDonations();
  }, [currentPage]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/donations/my-donations?page=${currentPage}&limit=10`);
      
      setDonations(response.data.donations);
      setTotalPages(response.data.pagination.pages);
      setTotalDonated(response.data.totalDonated);
      
      // Calculate stats
      const uniqueCampaigns = new Set(response.data.donations.map(d => d.campaign._id)).size;
      setStats({
        totalDonations: response.data.pagination.total,
        totalAmount: response.data.totalDonated,
        campaignsSupported: uniqueCampaigns,
        averageDonation: response.data.totalDonated / (response.data.pagination.total || 1)
      });
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donation history');
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadReceipt = async (donationId) => {
    try {
      // This would typically generate and download a PDF receipt
      toast.info('Receipt download feature coming soon!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  if (loading && donations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <FiHeart className="mr-3 text-red-500" />
              My Donations
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for making a difference in your community!
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <FiGift className="text-white h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Donated</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <FiHeart className="text-white h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Donations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDonations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <FiTarget className="text-white h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Campaigns Supported</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.campaignsSupported}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <FiTrendingUp className="text-white h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Donation</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageDonation)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Donations List */}
          {donations.length > 0 ? (
            <>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-200"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Donation History</h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {donations.map((donation, index) => (
                    <motion.div 
                      key={donation._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-1">
                                {donation.campaign.title}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <FiCalendar className="mr-2 h-4 w-4" />
                                {formatDateTime(donation.createdAt)}
                              </div>
                              {donation.receiptNumber && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <FiFileText className="mr-2 h-4 w-4" />
                                  Receipt: {donation.receiptNumber}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#52796F] mb-1">
                                {formatCurrency(donation.amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {donation.isAnonymous ? 'Anonymous donation' : 'Public donation'}
                              </div>
                            </div>
                          </div>

                          {donation.message && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <p className="text-sm text-gray-600 italic">
                                "{donation.message}"
                              </p>
                            </div>
                          )}

                          {/* Campaign Progress */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Campaign Progress</span>
                              <span>
                                {formatCurrency(donation.campaign.raisedAmount)} / {formatCurrency(donation.campaign.targetAmount)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#52796F] h-2 rounded-full"
                                style={{ 
                                  width: `${Math.min((donation.campaign.raisedAmount / donation.campaign.targetAmount) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <Link
                              to={`/fundraising/${donation.campaign._id}`}
                              className="flex items-center text-[#52796F] hover:text-[#354F52] text-sm font-medium transition-colors"
                            >
                              <FiEye className="mr-1 h-4 w-4" />
                              View Campaign
                            </Link>
                            
                            {donation.receiptNumber && (
                              <button
                                onClick={() => downloadReceipt(donation._id)}
                                className="flex items-center text-[#52796F] hover:text-[#354F52] text-sm font-medium transition-colors"
                              >
                                <FiDownload className="mr-1 h-4 w-4" />
                                Download Receipt
                              </button>
                            )}
                            
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              donation.campaign.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : donation.campaign.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {donation.campaign.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
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
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200"
            >
              <FiHeart className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No donations yet</h3>
              <p className="text-gray-600 mb-6">
                Start making a difference by supporting community campaigns.
              </p>
              <Link
                to="/fundraising"
                className="inline-flex items-center px-6 py-3 bg-[#52796F] text-white rounded-xl hover:bg-[#354F52] transition-colors duration-200"
              >
                <FiHeart className="mr-2 h-4 w-4" />
                Browse Campaigns
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyDonations;