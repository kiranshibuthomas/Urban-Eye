import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  CalendarIcon, 
  EyeIcon,
  ChatBubbleLeftIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const ComplaintCard = ({ complaint }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      road_issues: '🛣️',
      water_supply: '💧',
      electricity: '⚡',
      waste_management: '🗑️',
      public_transport: '🚌',
      parks_recreation: '🌳',
      street_lighting: '💡',
      drainage: '🌊',
      noise_pollution: '🔊',
      air_pollution: '🌫️',
      safety_security: '🛡️',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{getCategoryIcon(complaint.category)}</span>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {complaint.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {complaint.description}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2 ml-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span className="truncate">{complaint.address}, {complaint.city}</span>
        </div>

        {/* Images */}
        {complaint.images && complaint.images.length > 0 && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <PhotoIcon className="h-4 w-4 mr-1" />
            <span>{complaint.images.length} photo{complaint.images.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{getTimeAgo(complaint.submittedAt)}</span>
            </div>
            <div className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-1" />
              <span>{complaint.viewCount || 0}</span>
            </div>
            {complaint.adminNotes && complaint.adminNotes.length > 0 && (
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                <span>{complaint.adminNotes.length}</span>
              </div>
            )}
          </div>
          
          <Link
            to={`/complaint/${complaint._id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>

        {/* Admin Assignment */}
        {complaint.assignedTo && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Assigned to:</span>
              <span className="ml-1">{complaint.assignedTo.name}</span>
            </div>
          </div>
        )}

        {/* Resolution Notes */}
        {complaint.status === 'resolved' && complaint.resolutionNotes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-sm">
              <span className="font-medium text-green-700">Resolution:</span>
              <p className="text-gray-600 mt-1 line-clamp-2">{complaint.resolutionNotes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;

