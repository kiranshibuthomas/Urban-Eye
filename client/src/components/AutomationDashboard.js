import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiActivity, 
  FiTarget, 
  FiUsers, 
  FiTrendingUp,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AutomationDashboard = () => {
  const [aiStats, setAiStats] = useState(null);
  const [workloadStats, setWorkloadStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomationStats();
  }, []);

  const fetchAutomationStats = async () => {
    try {
      setLoading(true);
      
      // Fetch AI statistics
      const aiResponse = await fetch('/api/complaints/ai-stats', {
        credentials: 'include'
      });
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiStats(aiData.stats);
      }

      // Fetch workload statistics
      const workloadResponse = await fetch('/api/complaints/field-staff-workload', {
        credentials: 'include'
      });
      
      if (workloadResponse.ok) {
        const workloadData = await workloadResponse.json();
        setWorkloadStats(workloadData.workloadStats);
      }

    } catch (error) {
      console.error('Error fetching automation stats:', error);
      toast.error('Failed to load automation statistics');
    } finally {
      setLoading(false);
    }
  };

  const balanceWorkload = async () => {
    try {
      const response = await fetch('/api/complaints/balance-workload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({})
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchAutomationStats(); // Refresh stats
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error balancing workload:', error);
      toast.error('Failed to balance workload');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading automation statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🤖 Automation Dashboard</h2>
          <p className="text-gray-600">AI-powered complaint processing and field staff management</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchAutomationStats}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={balanceWorkload}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiUsers className="w-4 h-4 mr-2" />
            Balance Workload
          </button>
        </div>
      </div>

      {/* AI Statistics */}
      {aiStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{aiStats.totalComplaints}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiActivity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Categorized</p>
                <p className="text-2xl font-bold text-gray-900">{aiStats.aiCategorized}</p>
                <p className="text-xs text-green-600">
                  {aiStats.totalComplaints > 0 ? 
                    `${Math.round((aiStats.aiCategorized / aiStats.totalComplaints) * 100)}% automated` : 
                    '0% automated'
                  }
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiTarget className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {aiStats.avgConfidence ? `${Math.round(aiStats.avgConfidence * 100)}%` : 'N/A'}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto Assignment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(aiStats.autoAssignmentRate)}%
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiUsers className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Breakdown */}
      {aiStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            <div className="space-y-3">
              {Object.entries(aiStats.categoryStats).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${aiStats.totalComplaints > 0 ? (count / aiStats.totalComplaints) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Levels</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">High (&gt;80%)</span>
                <span className="text-sm font-bold text-gray-900">{aiStats.confidenceRanges.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-600">Medium (50-80%)</span>
                <span className="text-sm font-bold text-gray-900">{aiStats.confidenceRanges.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600">Low (&lt;50%)</span>
                <span className="text-sm font-bold text-gray-900">{aiStats.confidenceRanges.low}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Field Staff Workload */}
      {workloadStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Staff Workload</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Staff</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Active</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Completed</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {workloadStats.map((staff) => (
                  <tr key={staff.staffId} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          staff.isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        {staff.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">
                      {staff.department.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{staff.activeComplaints}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{staff.completedThisMonth}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        staff.workloadLevel === 'available' ? 'bg-green-100 text-green-800' :
                        staff.workloadLevel === 'light' ? 'bg-blue-100 text-blue-800' :
                        staff.workloadLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        staff.workloadLevel === 'heavy' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {staff.workloadLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AutomationDashboard;