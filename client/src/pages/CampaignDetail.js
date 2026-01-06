import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import DonationModal from '../components/DonationModal';
import CitizenHeader from '../components/CitizenHeader';
import { 
  FiHeart, 
  FiUsers, 
  FiClock, 
  FiMapPin, 
  FiShare2, 
  FiCalendar,
  FiTag,
  FiAlertTriangle,
  FiChevronLeft,
  FiTarget,
  FiTrendingUp,
  FiUser
} from 'react-icons/fi';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/fundraising/campaigns/${id}`);
      setCampaign(response.data.campaign);
      setRecentDonations(response.data.recentDonations);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Failed to load campaign details');
      navigate('/fundraising');
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSuccess = () => {
    setShowDonationModal(false);
    fetchCampaignDetails(); // Refresh campaign data
    toast.success('Thank you for your donation!');
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

  const shareCampaign = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Campaign link copied to clipboard!');
    }
  };

  if (loading) {
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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h2>
          <button
            onClick={() => navigate('/fundraising')}
            className="bg-[#52796F] text-white px-6 py-3 rounded-xl hover:bg-[#354F52] transition-colors duration-200"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
  const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const isActive = campaign.status === 'active' && daysRemaining > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader />
      
      {/* Back Button */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/fundraising')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 bg-white px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          >
            <FiChevronLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </motion.button>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Campaign Images */}
              {campaign.images && campaign.images.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-200"
                >
                  <img
                    src={campaign.images[0]}
                    alt={campaign.title}
                    className="w-full h-64 md:h-96 object-cover"
                  />
                </motion.div>
              )}

              {/* Campaign Info */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(campaign.category)} mr-3`}>
                        {campaign.category.replace('_', ' ').toUpperCase()}
                      </span>
                      {campaign.isUrgent && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <FiAlertTriangle className="mr-1 h-3 w-3" />
                          Urgent
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {campaign.title}
                    </h1>
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiCalendar className="mr-2 h-4 w-4" />
                      Created on {formatDate(campaign.createdAt)}
                      {campaign.location?.address && (
                        <>
                          <FiMapPin className="ml-4 mr-2 h-4 w-4" />
                          {campaign.location.address}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={shareCampaign}
                    className="bg-gray-100 text-gray-600 p-2 rounded-xl hover:bg-gray-200 transition-colors duration-200 border border-gray-200"
                  >
                    <FiShare2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    {['about', 'updates', 'donations'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeTab === tab
                            ? 'border-[#52796F] text-[#52796F]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'about' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About this campaign</h3>
                    <div className="prose max-w-none text-gray-600">
                      {campaign.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                    
                    {campaign.tags && campaign.tags.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {campaign.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                            >
                              <FiTag className="mr-1 h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Updates</h3>
                    {campaign.updates && campaign.updates.length > 0 ? (
                      <div className="space-y-4">
                        {campaign.updates.map((update, index) => (
                          <div key={index} className="border-l-4 border-[#52796F] pl-4 py-2 bg-gray-50 rounded-r-xl">
                            <h4 className="font-medium text-gray-900">{update.title}</h4>
                            <p className="text-gray-600 mt-1">{update.content}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              {formatDateTime(update.createdAt)} by {update.createdBy?.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No updates available yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'donations' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Donations</h3>
                    {recentDonations && recentDonations.length > 0 ? (
                      <div className="space-y-3">
                        {recentDonations.map((donation, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#52796F] rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {donation.donor?.name?.charAt(0) || 'A'}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {donation.donor?.name || 'Anonymous'}
                                </p>
                                {donation.message && (
                                  <p className="text-sm text-gray-600">"{donation.message}"</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#52796F]">
                                {formatCurrency(donation.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(donation.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No donations yet. Be the first to contribute!</p>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Donation Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 mb-6 sticky top-6 border border-gray-200"
              >
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(campaign.raisedAmount)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-[#52796F] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    raised of {formatCurrency(campaign.targetAmount)} goal
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-center text-gray-600 mb-1">
                      <FiUsers className="mr-1 h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{campaign.donorCount}</p>
                    <p className="text-sm text-gray-600">donors</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-center text-gray-600 mb-1">
                      <FiClock className="mr-1 h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{daysRemaining}</p>
                    <p className="text-sm text-gray-600">days left</p>
                  </div>
                </div>

                {isActive ? (
                  <button
                    onClick={() => user ? setShowDonationModal(true) : navigate('/login')}
                    className="w-full bg-[#52796F] text-white py-3 px-4 rounded-xl hover:bg-[#354F52] transition-colors duration-200 flex items-center justify-center font-medium"
                  >
                    <FiHeart className="mr-2 h-4 w-4" />
                    Donate Now
                  </button>
                ) : (
                  <div className="text-center p-4 bg-gray-100 rounded-xl border border-gray-200">
                    <p className="text-gray-600 font-medium">
                      {campaign.status === 'completed' ? 'Campaign Completed' : 'Campaign Ended'}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Campaign ends:</span>
                    <span className="font-medium">{formatDate(campaign.endDate)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Organizer Info */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizer</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#52796F] rounded-full flex items-center justify-center text-white font-medium">
                    {campaign.createdBy?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{campaign.createdBy?.name}</p>
                    <p className="text-sm text-gray-600">Campaign Organizer</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      <AnimatePresence>
        {showDonationModal && (
          <DonationModal
            campaign={campaign}
            onClose={() => setShowDonationModal(false)}
            onSuccess={handleDonationSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignDetail;