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
  FiBookmark,
  FiSend
} from 'react-icons/fi';
import { 
  IoArrowUpSharp, 
  IoArrowDownSharp 
} from 'react-icons/io5';
import { getUploadURL } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import publicFeedService from '../services/publicFeedService';
import toast from 'react-hot-toast';

const PublicComplaintCard = ({ complaint, onVoteUpdate, compact = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(complaint.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
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
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      urgent: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚡';
      case 'medium': return '📋';
      case 'low': return '📝';
      default: return '📋';
    }
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

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      // Load comments if not already loaded
      setLoadingComments(true);
      try {
        const response = await publicFeedService.getPublicComplaint(complaint.id);
        if (response.success) {
          setComments(response.complaint.comments || []);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      navigate('/login');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await publicFeedService.addComment(complaint.id, commentText.trim(), isAnonymousComment);
      
      if (response.success) {
        setComments([...comments, response.comment]);
        setCommentText('');
        setIsAnonymousComment(false);
        toast.success('Comment added!', { duration: 2000 });
      }
    } catch (error) {
      console.error('Comment error:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getTimeSince = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
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
            {/* System Priority Badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(complaint.finalPriority || complaint.systemPriority)}`}>
              {getPriorityIcon(complaint.finalPriority || complaint.systemPriority)} 
              {(complaint.finalPriority || complaint.systemPriority || 'medium').toUpperCase()}
            </span>
            {/* Community Impact Indicator */}
            {complaint.communityImpact && complaint.communityImpact.score > 20 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                🏘️ High Community Impact
              </span>
            )}
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
                src={getUploadURL(complaint.images[0].url)}
                alt="Complaint"
                className="w-full max-h-96 object-cover rounded cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handleCardClick}
                onError={(e) => {
                  console.error('Image failed to load:', getUploadURL(complaint.images[0].url));
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
                src={getUploadURL(complaint.images[0].url)}
                alt="Complaint"
                className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-95 transition-opacity flex-shrink-0"
                onClick={handleCardClick}
                onError={(e) => {
                  console.error('Image failed to load:', getUploadURL(complaint.images[0].url));
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
              onClick={handleToggleComments}
              className={`flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-medium ${
                showComments ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <FiMessageSquare className="w-4 h-4" />
              <span>{comments.length || complaint.commentCount || 0} {showComments ? '▲' : '▼'}</span>
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
              <span className={`font-medium ${getPriorityColor(complaint.finalPriority || complaint.systemPriority).split(' ')[0]}`}>
                {getPriorityIcon(complaint.finalPriority || complaint.systemPriority)} 
                {(complaint.finalPriority || complaint.systemPriority || 'MEDIUM').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {/* Comment Form */}
              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows="2"
                        maxLength="500"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAnonymousComment}
                            onChange={(e) => setIsAnonymousComment(e.target.checked)}
                            className="rounded"
                          />
                          Anonymous
                        </label>
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !commentText.trim()}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          <FiSend className="w-3 h-3" />
                          {isSubmittingComment ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Login to comment
                  </button>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  Loading comments...
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{comment.userName}</span>
                          <span className="text-xs text-gray-500">{getTimeSince(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-3">No comments yet. Be the first to comment!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicComplaintCard;