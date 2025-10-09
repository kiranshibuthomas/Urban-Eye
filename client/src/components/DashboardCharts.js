import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Custom Tooltip Component - memoized for performance
const CustomTooltip = memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-gray-600">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>{' '}
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

// Complaints Trend Chart - Enhanced and memoized
export const ComplaintsTrendChart = memo(({ data }) => {
  // Use real data if available, otherwise show empty state
  const chartData = data && data.length > 0 ? data : [
    { name: 'Mon', complaints: 0, resolved: 0 },
    { name: 'Tue', complaints: 0, resolved: 0 },
    { name: 'Wed', complaints: 0, resolved: 0 },
    { name: 'Thu', complaints: 0, resolved: 0 },
    { name: 'Fri', complaints: 0, resolved: 0 },
    { name: 'Sat', complaints: 0, resolved: 0 },
    { name: 'Sun', complaints: 0, resolved: 0 },
  ];
  
  console.log('Chart received data:', data);
  console.log('Chart using data:', chartData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-gradient-to-br from-white to-blue-50/30 rounded-3xl p-8 shadow-2xl border border-blue-100/50 hover:shadow-3xl transition-shadow duration-200"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Weekly Trends
              </span>
            </h3>
            <p className="text-sm text-gray-600 mt-2">Complaints submitted vs resolved (Last 7 days)</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Submitted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Resolved</span>
            </div>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280" 
            style={{ fontSize: '13px', fontWeight: '500' }}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280" 
            style={{ fontSize: '13px', fontWeight: '500' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="complaints"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorComplaints)"
            strokeWidth={3}
            animationDuration={800}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorResolved)"
            strokeWidth={3}
            animationDuration={800}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if data length or values change
  if (!prevProps.data && !nextProps.data) return true;
  if (!prevProps.data || !nextProps.data) return false;
  if (prevProps.data.length !== nextProps.data.length) return false;
  
  // Deep comparison for data array
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

ComplaintsTrendChart.displayName = 'ComplaintsTrendChart';

// Category Distribution Chart
export const CategoryDistributionChart = ({ data }) => {
  const chartData = data || [
    { name: 'Infrastructure', value: 145, color: '#3B82F6' },
    { name: 'Sanitation', value: 98, color: '#10B981' },
    { name: 'Roads', value: 122, color: '#F59E0B' },
    { name: 'Utilities', value: 87, color: '#8B5CF6' },
    { name: 'Traffic', value: 65, color: '#EF4444' },
    { name: 'Others', value: 43, color: '#6B7280' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-200/30 dark:border-dark-700/30"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Distribution</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Breakdown by complaint type</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Status Overview Chart - Enhanced and memoized
export const StatusOverviewChart = memo(({ stats }) => {
  const chartData = [
    { name: 'Pending', value: stats?.pending || 0, color: '#F59E0B', icon: '⏳' },
    { name: 'In Progress', value: stats?.inProgress || 0, color: '#3B82F6', icon: '🔄' },
    { name: 'Resolved', value: stats?.resolved || 0, color: '#10B981', icon: '✅' },
    { name: 'Rejected', value: stats?.rejected || 0, color: '#EF4444', icon: '❌' },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="bg-gradient-to-br from-white to-green-50/30 rounded-3xl p-8 shadow-2xl border border-green-100/50 hover:shadow-3xl transition-shadow duration-200"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Status Distribution
              </span>
            </h3>
            <p className="text-sm text-gray-600 mt-2">Current complaint status breakdown</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 px-4 py-2 rounded-xl">
            <p className="text-xs text-gray-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} barSize={60}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280" 
            style={{ fontSize: '13px', fontWeight: '500' }}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280" 
            style={{ fontSize: '13px', fontWeight: '500' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[12, 12, 0, 0]}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Status Legend with Percentages */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if stats values change
  return (
    prevProps.stats?.pending === nextProps.stats?.pending &&
    prevProps.stats?.inProgress === nextProps.stats?.inProgress &&
    prevProps.stats?.resolved === nextProps.stats?.resolved &&
    prevProps.stats?.rejected === nextProps.stats?.rejected
  );
});

StatusOverviewChart.displayName = 'StatusOverviewChart';

// Monthly Performance Chart
export const MonthlyPerformanceChart = ({ data }) => {
  const chartData = data || [
    { month: 'Jan', complaints: 145, resolved: 132, satisfaction: 91 },
    { month: 'Feb', complaints: 167, resolved: 156, satisfaction: 93 },
    { month: 'Mar', complaints: 189, resolved: 178, satisfaction: 94 },
    { month: 'Apr', complaints: 203, resolved: 195, satisfaction: 96 },
    { month: 'May', complaints: 221, resolved: 210, satisfaction: 95 },
    { month: 'Jun', complaints: 198, resolved: 189, satisfaction: 95 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-200/30 dark:border-dark-700/30"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Performance</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">6-month performance overview</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="complaints"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 5 }}
            activeDot={{ r: 7 }}
            animationDuration={1500}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ fill: '#10B981', r: 5 }}
            activeDot={{ r: 7 }}
            animationDuration={1500}
          />
          <Line
            type="monotone"
            dataKey="satisfaction"
            stroke="#8B5CF6"
            strokeWidth={3}
            dot={{ fill: '#8B5CF6', r: 5 }}
            activeDot={{ r: 7 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Resolution Time Chart
export const ResolutionTimeChart = ({ data }) => {
  const chartData = data || [
    { category: 'Infrastructure', avgTime: 3.5 },
    { category: 'Sanitation', avgTime: 2.1 },
    { category: 'Roads', avgTime: 4.2 },
    { category: 'Utilities', avgTime: 2.8 },
    { category: 'Traffic', avgTime: 1.9 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-200/30 dark:border-dark-700/30"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Average Resolution Time</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Days to resolve by category</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis dataKey="category" type="category" stroke="#6B7280" style={{ fontSize: '12px' }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="avgTime" 
            fill="#3B82F6"
            radius={[0, 8, 8, 0]}
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`hsl(${210 - index * 20}, 70%, ${50 + index * 5}%)`} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

