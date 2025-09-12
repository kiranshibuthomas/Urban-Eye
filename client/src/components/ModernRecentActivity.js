import React from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiUser, FiCalendar } from 'react-icons/fi';

const ModernRecentActivity = ({ complaints, getStatusColor, getPriorityColor, getStatusIcon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="lg:col-span-2 bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-200/30 dark:border-dark-700/30"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {complaints.slice(0, 4).map((complaint, index) => (
          <motion.div
            key={complaint.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-dark-700/50 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-dark-600/50 transition-colors duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl ${getPriorityColor(complaint.priority)}`}>
                {getStatusIcon(complaint.status)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{complaint.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{complaint.address || 'Location not specified'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                {complaint.status.replace('-', ' ')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(complaint.date).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ModernRecentActivity;
