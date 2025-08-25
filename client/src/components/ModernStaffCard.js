import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiActivity } from 'react-icons/fi';

const ModernStaffCard = ({ staff, index = 0 }) => {
  return (
    <motion.div
      key={staff.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center ring-4 ring-primary-100">
              {staff.avatar ? (
                <img
                  src={staff.avatar}
                  alt={staff.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <FiUser className="h-8 w-8 text-white" />
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
              staff.active ? 'bg-teal-400' : 'bg-gray-400'
            }`}></div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{staff.name}</h4>
            <p className="text-sm text-gray-600 mb-1">{staff.role}</p>
            <p className="text-sm text-gray-500 mb-2">{staff.department}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Active assignments: {staff.assignments}</span>
              <span>Performance: {staff.performance}%</span>
              <span className="flex items-center">
                <FiActivity className="h-4 w-4 mr-1 text-primary-500" />
                {staff.lastActive}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
            staff.active ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}>
            {staff.active ? 'Active' : 'Inactive'}
          </span>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
            >
              {staff.active ? 'Deactivate' : 'Activate'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernStaffCard;
