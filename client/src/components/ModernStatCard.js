import React, { memo } from 'react';
import { motion } from 'framer-motion';

const ModernStatCard = memo(({ icon: Icon, title, value, change, color, delay = 0, isLive = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3, ease: "easeOut" }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    className="relative group"
  >
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-base font-medium text-gray-600">{title}</p>
            {isLive && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">LIVE</span>
              </div>
            )}
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
          {change && change !== 0 && (
            <div className="flex items-center">
              <span className={`text-base font-medium ${change > 0 ? 'text-teal-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-base text-gray-500 ml-1">from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${color} group-hover:scale-105 transition-transform duration-200`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  </motion.div>
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.value === nextProps.value &&
    prevProps.change === nextProps.change &&
    prevProps.isLive === nextProps.isLive &&
    prevProps.title === nextProps.title
  );
});

ModernStatCard.displayName = 'ModernStatCard';

export default ModernStatCard;
