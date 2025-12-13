import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiEye, 
  FiMapPin, 
  FiClock,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiImage,
  FiX,
  FiShare2,
  FiBookmark,
  FiMessageSquare
} from 'react-icons/fi';
import { 
  IoArrowUpSharp, 
  IoArrowDownSharp 
} from 'react-icons/io5';
import LoadingSpinner from '../components/LoadingSpinner';
import { getBaseURL } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import publicFeedService from '../services/publicFeedService';
import toast from 'react-hot-toast';

const PublicComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const response = await publicFeedService.getPublicComplaint(id);
      
      if (response.success) {
        setComplaint(response.complaint);
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      toast.error('Failed to load complaint details');
      navigate('/public-feed');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote on complaints');
      navigate('/login');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    try {
      const response = await publicFeedService.voteOnComplaint(id, voteType);
      
      if (response.success) {
        setComplaint(prev => ({
          ...prev,
          upvotes: response.data.upvotes,
          downvotes: response.data.downvotes,
          userVote: response.data.userVote
        }));
        
        toast.success('Vote recorded successfully');
      }
    } catch (error) {
      console.error('Vote error:', error);
      toast.error(error.response?.data?.message || 'Failed to record vote');
    } finally {
      setIsVoting(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      road_issues: 'bg-orange-100 text-orange-800 border-orange-200',
      water_supply: 'bg-blue-100 text-blue-800 border-blue-200',
      electricity: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      waste_management: 'bg-green-100 text-green-800 border-green-200',
      public_transport: 'bg-purple-100 text-purple-800 border-purple-200',
      parks_recreation: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      street_lighting: 'bg-amber-100 text-amber-800 border-amber-200',
      drainage: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      noise_pollution: 'bg-red-100 text-red-800 border-red-200',
      air_pollution: 'bg-gray-100 text-gray-800 border-gray-200',
      safety_security: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      other: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[category] || colors.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      assigned: 'bg-orange-100 text-orange-800 border-orange-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      work_completed: 'bg-purple-100 text-purple-800 border-purple-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      urgent: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[priority] || colors.medium;
  };

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading complaint details..." />;
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint not found</h3>
          <p className="text-gray-500 mb-4">The complaint you're looking for doesn't exist or is not public.</p>
          <button
            onClick={() => navigate('/public-feed')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Public Feed
          </button>
        </div>
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
        
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={() => navigate('/public-feed')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#52796F] transition-colors mb-6 font-medium"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Public Feed
            </button>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {complaint.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getCategoryColor(complaint.category)}`}>
                    {formatCategory(complaint.category)}
                  </span>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>

              {/* Reddit-style Vote Section */}
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center bg-gray-100 border border-gray-300 rounded p-1">
                  <button
                    onClick={() => handleVote('upvote')}
                    disabled={isVoting}
                    className={`p-2 rounded transition-all duration-150 ${
                      complaint.userVote === 'upvote'
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <IoArrowUpSharp className="w-6 h-6" />
                  </button>
                  
                  <div className={`text-lg font-bold px-3 ${
                    (complaint.upvotes - complaint.downvotes) > 0 ? 'text-red-500' : 
                    (complaint.upvotes - complaint.downvotes) < 0 ? 'text-blue-500' : 
                    'text-gray-500'
                  }`}>
                    {complaint.upvotes - complaint.downvotes}
                  </div>
                  
                  <button
                    onClick={() => handleVote('downvote')}
                    disabled={isVoting}
                    className={`p-2 rounded transition-all duration-150 ${
                      complaint.userVote === 'downvote'
                        ? 'text-blue-500 bg-blue-50'
                        : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <IoArrowDownSharp className="w-6 h-6" />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300 transition-colors font-medium">
                    <FiMessageSquare className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300 transition-colors font-medium">
                    <FiShare2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300 transition-colors font-medium">
                    <FiBookmark className="w-4 h-4" />
                    <span>Save</span>
                  </button>

                  <div className="flex items-center gap-1 text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded border border-gray-300">
                    <FiEye className="w-4 h-4" />
                    <span>{complaint.viewCount} views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#84A98C]/20 p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              {/* Images */}
              {complaint.images && complaint.images.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Images ({complaint.images.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {complaint.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={`${getBaseURL()}${image.url}`}
                          alt={`Complaint image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <FiImage className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution info */}
              {complaint.resolutionInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-green-900">Resolution Details</h2>
                  </div>
                  
                  {complaint.resolutionInfo.resolutionNotes && (
                    <div className="mb-4">
                      <h3 className="font-medium text-green-900 mb-2">Resolution Notes:</h3>
                      <p className="text-green-800">{complaint.resolutionInfo.resolutionNotes}</p>
                    </div>
                  )}
                  
                  {complaint.resolutionInfo.workCompletionNotes && (
                    <div className="mb-4">
                      <h3 className="font-medium text-green-900 mb-2">Work Completion Notes:</h3>
                      <p className="text-green-800">{complaint.resolutionInfo.workCompletionNotes}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-green-700">
                    {complaint.resolutionInfo.workCompletedAt && (
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>Work completed: {formatDate(complaint.resolutionInfo.workCompletedAt)}</span>
                      </div>
                    )}
                    {complaint.resolutionInfo.resolvedAt && (
                      <div className="flex items-center gap-1">
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Resolved: {formatDate(complaint.resolutionInfo.resolvedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Complaint info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Reported by</div>
                      <div className="font-medium text-gray-900">{complaint.citizenName}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiClock className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Submitted</div>
                      <div className="font-medium text-gray-900">{complaint.timeSinceSubmission}</div>
                      <div className="text-xs text-gray-500">{formatDate(complaint.submittedAt)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Location</div>
                      <div className="font-medium text-gray-900">{complaint.location.address}</div>
                      <div className="text-sm text-gray-600">{complaint.location.city}</div>
                      {complaint.location.pincode && (
                        <div className="text-sm text-gray-600">PIN: {complaint.location.pincode}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Engagement</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Views</span>
                    <span className="font-semibold text-gray-900">{complaint.viewCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Upvotes</span>
                    <span className="font-semibold text-green-600">{complaint.upvotes}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Downvotes</span>
                    <span className="font-semibold text-red-600">{complaint.downvotes}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Net Score</span>
                      <span className={`font-semibold ${
                        (complaint.upvotes - complaint.downvotes) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {complaint.upvotes - complaint.downvotes > 0 ? '+' : ''}{complaint.upvotes - complaint.downvotes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <FiX className="w-8 h-8" />
            </button>
            <img
              src={`${getBaseURL()}${selectedImage.url}`}
              alt="Complaint image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicComplaintDetailPage;