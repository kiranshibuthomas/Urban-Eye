import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiAlertTriangle,
  FiMapPin,
  FiUser,
  FiClock,
  FiX,
  FiChevronDown
} from 'react-icons/fi';
import { 
  MdAddRoad, 
  MdWater, 
  MdElectricalServices, 
  MdDeleteOutline, 
  MdConstruction, 
  MdMoreHoriz,
  MdWaterDrop
} from 'react-icons/md';

const NearbyReportsDisplay = ({ 
  reports, 
  loading, 
  onChangeLocation, 
  onProceedWithReport,
  isOpen,
  onClose
}) => {
  const [showAll, setShowAll] = useState(false);

  // Category icons
  const categoryIcons = {
    road: MdAddRoad,
    water: MdWater,
    drain: MdWaterDrop,
    electrical: MdElectricalServices,
    waste: MdDeleteOutline,
    construction: MdConstruction,
    others: MdMoreHoriz
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-700">Checking nearby reports...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!reports || reports.length === 0 || !isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 100 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 400,
              duration: 0.4
            }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-100 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-2xl">
                    <FiAlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Similar Reports Found</h2>
                    <p className="text-red-100 text-sm">
                      {reports.length} report{reports.length > 1 ? 's' : ''} already exist in this area
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-2xl transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
              <p className="text-gray-600 text-sm mb-4">
                Please check if your issue is already reported below. If it's different, you can continue with your report.
              </p>

              {/* Reports List */}
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {reports.slice(0, showAll ? reports.length : 3).map((report) => {
                  const CategoryIcon = categoryIcons[report.category] || MdMoreHoriz;
                  
                  return (
                    <div
                      key={report._id}
                      className="border border-gray-200 rounded-2xl p-3 hover:bg-white hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="bg-gray-100 p-2 rounded-2xl">
                          <CategoryIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {report.title || `${report.category} issue`}
                            </h4>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-2xl">
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {report.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <FiMapPin className="h-3 w-3 mr-1" />
                              {report.distance}m away
                            </span>
                            <span className="flex items-center">
                              <FiUser className="h-3 w-3 mr-1" />
                              {report.citizenName}
                            </span>
                            <span className="flex items-center">
                              <FiClock className="h-3 w-3 mr-1" />
                              {formatDate(report.submittedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {reports.length > 3 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-1"
                  >
                    <span>
                      {showAll ? 'Show less' : `Show ${reports.length - 3} more`}
                    </span>
                    <FiChevronDown 
                      className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} 
                    />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 bg-white rounded-b-3xl -mx-6 -mb-6 px-6 pb-6">
                <button
                  onClick={onChangeLocation}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 text-sm font-medium transition-colors duration-200"
                >
                  Change Location
                </button>
                <button
                  onClick={onProceedWithReport}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 text-sm font-medium transition-colors duration-200"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NearbyReportsDisplay;