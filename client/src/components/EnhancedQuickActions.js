import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiFileText, 
  FiMapPin, 
  FiClock,
  FiTrendingUp,
  FiArrowRight,
  FiZap,
  FiActivity
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const EnhancedQuickActions = ({ userStats }) => {
  const navigate = useNavigate();
  const [hoveredAction, setHoveredAction] = useState(null);

  const quickActions = [
    {
      id: 'report',
      title: 'Report Issue',
      subtitle: 'Submit new complaint',
      icon: FiPlus,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      action: () => navigate('/report-issue'),
      primary: true,
      stats: 'Quick & Easy'
    },
    {
      id: 'track',
      title: 'Track Status',
      subtitle: `${userStats.pending || 0} pending`,
      icon: FiActivity,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      action: () => navigate('/reports-history'),
      stats: 'Real-time updates'
    },
    {
      id: 'history',
      title: 'My Reports',
      subtitle: `${userStats.totalComplaints || 0} total reports`,
      icon: FiFileText,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      action: () => navigate('/reports-history'),
      stats: 'Complete history'
    },
    {
      id: 'nearby',
      title: 'Nearby Issues',
      subtitle: 'Community updates',
      icon: FiMapPin,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      action: () => navigate('/reports-history?view=map'),
      stats: 'Location-based'
    }
  ];

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
          >
            <FiZap className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredAction(action.id)}
              onHoverEnd={() => setHoveredAction(null)}
              onClick={action.action}
              className={`relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                action.primary 
                  ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-white border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
              }`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-current rounded-full -translate-y-10 translate-x-10" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-current rounded-full translate-y-8 -translate-x-8" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      action.primary ? 'bg-white/20' : action.bgColor
                    }`}
                    animate={hoveredAction === action.id ? { 
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <action.icon className={`w-6 h-6 ${
                      action.primary ? 'text-white' : action.textColor
                    }`} />
                  </motion.div>
                  
                  <motion.div
                    animate={hoveredAction === action.id ? { x: 5 } : { x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiArrowRight className={`w-5 h-5 ${
                      action.primary ? 'text-white/70' : 'text-gray-400'
                    }`} />
                  </motion.div>
                </div>

                <h3 className={`text-lg font-bold mb-1 ${
                  action.primary ? 'text-white' : 'text-gray-900'
                }`}>
                  {action.title}
                </h3>
                
                <p className={`text-sm mb-3 ${
                  action.primary ? 'text-white/80' : 'text-gray-600'
                }`}>
                  {action.subtitle}
                </p>

                <div className={`text-xs font-medium ${
                  action.primary ? 'text-white/60' : 'text-gray-500'
                }`}>
                  {action.stats}
                </div>

                {/* Hover Effect Overlay */}
                <AnimatePresence>
                  {hoveredAction === action.id && !action.primary && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-5 rounded-xl`}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedQuickActions;