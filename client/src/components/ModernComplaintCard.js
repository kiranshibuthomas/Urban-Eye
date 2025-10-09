import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMapPin, 
  FiUser, 
  FiCalendar, 
  FiEye, 
  FiMessageSquare, 
  FiMoreVertical 
} from 'react-icons/fi';

const ModernComplaintCard = memo(({ 
  complaint, 
  getStatusColor, 
  getPriorityColor, 
  getStatusIcon, 
  index = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-shadow duration-200 p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>
          <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
            <span className="flex items-center">
              <FiMapPin className="h-4 w-4 mr-1 text-primary-500" />
              {complaint.address || 'Location not specified'}
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
              {complaint.category?.replace('_', ' ') || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span className="flex items-center">
              <FiUser className="h-4 w-4 mr-1 text-primary-500" />
              {complaint.citizenName || complaint.citizen?.name || 'Unknown'}
            </span>
            <span className="flex items-center">
              <FiCalendar className="h-4 w-4 mr-1 text-primary-500" />
              {new Date(complaint.submittedAt || complaint.date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
            {getStatusIcon(complaint.status)}
            <span className="ml-1 capitalize">{complaint.status.replace('-', ' ')}</span>
          </span>
          {complaint.assignedTo && (
            <span className="text-sm text-gray-600">Assigned to: {complaint.assignedTo}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {complaint.images > 0 && (
            <span className="flex items-center">
              <FiEye className="h-4 w-4 mr-1 text-primary-500" />
              {complaint.images} images
            </span>
          )}
          {complaint.comments > 0 && (
            <span className="flex items-center">
              <FiMessageSquare className="h-4 w-4 mr-1 text-primary-500" />
              {complaint.comments} comments
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-150"
          >
            View
          </button>
          <button
            className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors duration-150"
          >
            Assign
          </button>
          <button
            className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors duration-150"
          >
            <FiMoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.complaint._id === nextProps.complaint._id &&
    prevProps.complaint.status === nextProps.complaint.status &&
    prevProps.complaint.priority === nextProps.complaint.priority
  );
});

ModernComplaintCard.displayName = 'ModernComplaintCard';

export default ModernComplaintCard;
