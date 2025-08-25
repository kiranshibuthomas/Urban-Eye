import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiUsers, FiSend, FiDownload } from 'react-icons/fi';

const ModernQuickActions = () => {
  const actions = [
    { 
      icon: FiPlus, 
      label: 'New Complaint', 
      color: 'bg-primary-500',
      description: 'Create a new complaint entry'
    },
    { 
      icon: FiUsers, 
      label: 'Add Staff', 
      color: 'bg-teal-500',
      description: 'Add new staff member'
    },
    { 
      icon: FiSend, 
      label: 'Send Alert', 
      color: 'bg-accent-500',
      description: 'Send emergency alert'
    },
    { 
      icon: FiDownload, 
      label: 'Export Data', 
      color: 'bg-primary-600',
      description: 'Export dashboard data'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center p-3 text-left rounded-2xl hover:bg-gray-50 transition-all duration-200 group"
          >
            <div className={`p-2 rounded-xl ${action.color} group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <span className="font-medium text-gray-700">{action.label}</span>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ModernQuickActions;
