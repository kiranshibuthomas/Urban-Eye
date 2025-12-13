import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiEye, 
  FiMapPin, 
  FiClock,
  FiUser,
  FiImage,
  FiMessageSquare,
  FiShare2,
  FiBookmark
} from 'react-icons/fi';
import { 
  IoArrowUpSharp, 
  IoArrowDownSharp 
} from 'react-icons/io5';
import { getBaseURL } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import publicFeedService from '../services/publicFeedService';
import toast from 'react-hot-toast';

const PublicComplaintCard = ({ complaint, onVoteUpdate, compact = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [localVoteData, setLocalVoteData] = useState({
    upvotes: complaint.upvotes || 0,
    downvotes: complaint.downvotes || 0,
    userVote: complaint.userVote
  });

  // Calculate net score (Reddit-style)
  const netScore = localVoteData.upvotes - localVoteData.downvotes;
  
  // Format score for display
  const formatScore = (score) => {
    if (Math.abs(score) >= 1000) {
      return (score / 1000).toFixed(1) + 'k';
    }
    return score.toString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      road_issues: 'bg-orange-50 text-orange-700 border-orange-200',
      water_supply: 'bg-blue-50 text-blue-700 border-blue-200',
      electricity: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      waste_management: 'bg-green-50 text-green-700 border-green-200',
      public_transport: 'bg-purple-50 text-purple-700 border-purple-200',
      parks_recreation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      street_lighting: 'bg-amber-50 text-amber-700 border-amber-200',
      drainage: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      noise_pollution: 'bg-red-50 text-red-700 border-red-200',
      air_pollution: 'bg-gray-50 text-gray-700 border-gray-200',
      safety_security: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      other: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return colors[category] || colors.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      assigned: 'bg-orange-50 text-orange-700 border-orange-200',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
      work_completed: 'bg-purple-50 text-purple-700 border-purple-200',
      resolved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || colors.medium;
  };

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      const response = await publicFeedService.voteOnComplaint(complaint.id, voteType);
      
      if (response.success) {
        setLocalVoteData({
          upvotes: response.data.upvotes,
          downvotes: response.data.downvotes,
          userVote: response.data.userVote
        });
        
        if (onVoteUpdate) {
          onVoteUpdate(complaint.id, response.data);
        }
        
        // Subtle success feedback
        if (voteType === 'upvote') {
          toast.success('👍 Upvoted!', { duration: 2000 });
        } else {
          toast.success('👎 Downvoted!', { duration: 2000 });
        }
      }
    } catch (error) {
      console.error('Vote error:', error);
      toast.error(error.response?.data?.message || 'Failed to record vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/public-feed/${complaint.id}`);
  };

  return (
    <div className="bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200 mb-2">
      <div className="flex">
        {/* Reddit-style Vote Column */}
        <div className="flex flex-col items-center justify-start py-2 px-1 bg-gray-50 border-r border-gray-300 w-12">
          <button
            onClick={() => handleVote('upvote')}
            disabled={isVoting}
            className={`p-1 rounded transition-all duration-150 ${
              localVoteData.userVote === 'upvote'
                ? 'text-red-500 bg-red-50'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <IoArrowUpSharp className="w-6 h-6" />
          </button>
          
          <div className={`text-xs font-bold py-1 px-1 text-center ${
            netScore > 0 ? 'text-red-500' : 
            netScore < 0 ? 'text-blue-500' : 
            'text-gray-500'
          }`}>
            {formatScore(netScore)}
          </div>
          
          <button
            onClick={() => handleVote('downvote')}
            disabled={isVoting}
            className={`p-1 rounded transition-all duration-150 ${
              localVoteData.userVote === 'downvote'
                ? 'text-blue-500 bg-blue-50'
                : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <IoArrowDownSharp className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3">
          {/* Header with meta info */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 flex-wrap">
            <span className="text-gray-700 font-medium">r/CivicIssues</span>
            <span>•</span>
            <span>Posted by u/{complaint.citizenName}</span>
            <span>•</span>
            <span>{complaint.timeSinceSubmission}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(complaint.category)}`}>
              {formatCategory(complaint.category)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          {/* Title */}
          <h3 
            className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors mb-2 leading-tight"
            onClick={handleCardClick}
          >
            {complaint.title}
          </h3>

          {/* Description - only show if not compact or no image */}
          {(!compact || !complaint.images || complaint.images.length === 0) && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-3 leading-relaxed">
              {complaint.description}
            </p>
          )}

          {/* Image thumbnail (if exists) */}
          {complaint.images && complaint.images.length > 0 && !compact && (
            <div className="relative mb-3">
              <img
                src={`${getBaseURL()}${complaint.images[0].url}`}
                alt="Complaint"
                className="w-full max-h-96 object-cover rounded cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handleCardClick}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {complaint.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <FiImage className="w-3 h-3" />
                  <span>+{complaint.images.length - 1}</span>
                </div>
              )}
            </div>
          )}

          {/* Compact mode thumbnail */}
          {complaint.images && complaint.images.length > 0 && compact && (
            <div className="flex items-start gap-3 mb-3">
              <img
                src={`${getBaseURL()}${complaint.images[0].url}`}
                alt="Complaint"
                className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-95 transition-opacity flex-shrink-0"
                onClick={handleCardClick}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="flex-1">
                <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed">
                  {complaint.description}
                </p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button 
              onClick={handleCardClick}
              className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-medium"
            >
              <FiMessageSquare className="w-4 h-4" />
              <span>Comments</span>
            </button>
            
            <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-medium">
              <FiShare2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            
            <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-medium">
              <FiBookmark className="w-4 h-4" />
              <span>Save</span>
            </button>

            <div className="flex items-center gap-4 ml-auto text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <FiEye className="w-3 h-3" />
                <span>{complaint.viewCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <FiMapPin className="w-3 h-3" />
                <span>{complaint.location.city}</span>
              </div>
              <span className={`font-medium ${getPriorityColor(complaint.priority).split(' ')[0]}`}>
                {complaint.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicComplaintCard;