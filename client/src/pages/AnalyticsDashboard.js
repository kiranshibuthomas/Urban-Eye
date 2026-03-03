import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/analytics/dashboard?timeRange=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    const colors = {
      excellent: 'text-green-600 bg-green-100',
      good: 'text-blue-600 bg-blue-100',
      fair: 'text-yellow-600 bg-yellow-100',
      poor: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[status] || colors.fair;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
          <p className="text-base text-gray-600">Comprehensive analytics for complaint management system</p>
        </div>

        {/* Time Range Selector & System Health */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-indigo-600">
              {analytics.systemHealth.score}
            </div>
            <div>
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(
                  analytics.systemHealth.status
                )}`}
              >
                {analytics.systemHealth.status.toUpperCase()}
              </span>
              <p className="text-gray-600 mt-1">System Health Score</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[7, 30, 90, 180].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'hotspots', label: 'Hotspots' },
              { id: 'performance', label: 'Performance' },
              { id: 'satisfaction', label: 'Satisfaction' },
              { id: 'budget', label: 'Budget Impact' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && (
            <OverviewTab analytics={analytics} />
          )}
          {activeTab === 'hotspots' && (
            <HotspotsTab hotspots={analytics.hotspots} />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab performance={analytics.fieldStaffPerformance} />
          )}
          {activeTab === 'satisfaction' && (
            <SatisfactionTab satisfaction={analytics.satisfaction} />
          )}
          {activeTab === 'budget' && (
            <BudgetTab budgetImpact={analytics.budgetImpact} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Avg Performance Score"
          value={analytics.fieldStaffPerformance.avgPerformanceScore}
          suffix="/100"
          color="indigo"
        />
        <MetricCard
          title="Satisfaction Score"
          value={analytics.satisfaction.satisfactionScore}
          suffix="%"
          color="green"
        />
        <MetricCard
          title="Cost Efficiency"
          value={analytics.budgetImpact.costEfficiency}
          suffix="%"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Staff
          </h3>
          <div className="space-y-3">
            {analytics.fieldStaffPerformance.topPerformers.map((staff, index) => (
              <div
                key={staff.fieldStaff.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{staff.fieldStaff.name}</p>
                    <p className="text-sm text-gray-500">{staff.fieldStaff.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">
                    {staff.performanceScore}
                  </p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Complaint Hotspots
          </h3>
          <div className="space-y-3">
            {analytics.hotspots.slice(0, 5).map((hotspot, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">
                    {hotspot.category.replace('_', ' ')}
                  </span>
                  <span className={`text-sm font-medium ${
                    hotspot.trend === 'increasing' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {hotspot.trend === 'increasing' ? '↑' : '↓'} {Math.abs(hotspot.trendPercentage)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{hotspot.count} complaints</span>
                  <span>Risk: {hotspot.riskScore.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hotspots Tab Component
const HotspotsTab = ({ hotspots }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Predicted Complaint Hotspots
      </h3>
      <p className="text-gray-600">
        Areas with high complaint density and risk scores
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotspots.map((hotspot, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 capitalize">
                  {hotspot.category.replace('_', ' ')}
                </h4>
                <p className="text-sm text-gray-500">
                  Lat: {hotspot.location.lat.toFixed(4)}, Lng: {hotspot.location.lng.toFixed(4)}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                hotspot.trend === 'increasing'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {hotspot.trend}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{hotspot.count}</p>
                <p className="text-xs text-gray-500">Complaints</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {hotspot.riskScore.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">Risk Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {hotspot.trendPercentage > 0 ? '+' : ''}{hotspot.trendPercentage}%
                </p>
                <p className="text-xs text-gray-500">Trend</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ performance }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Field Staff Performance Rankings
        </h3>
        <div className="space-y-3">
          {performance.topPerformers.map((staff, index) => (
            <div
              key={staff.fieldStaff.id}
              className="bg-white rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-indigo-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{staff.fieldStaff.name}</p>
                    <p className="text-sm text-gray-500">
                      {staff.fieldStaff.department} • {staff.fieldStaff.experience} years exp
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {staff.performanceScore}
                  </p>
                  <p className="text-xs text-gray-500">Performance Score</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <p className="font-semibold text-gray-900">
                    {staff.metrics.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-500">Completion</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {staff.metrics.slaComplianceRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-500">SLA</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {staff.metrics.avgWorkQuality.toFixed(1)}/5
                  </p>
                  <p className="text-gray-500">Quality</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {staff.metrics.avgResolutionTimeHours.toFixed(1)}h
                  </p>
                  <p className="text-gray-500">Avg Time</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Satisfaction Tab Component
const SatisfactionTab = ({ satisfaction }) => {
  const distributionData = {
    labels: ['Excellent (5)', 'Good (4)', 'Average (3)', 'Poor (2)', 'Very Poor (1)'],
    datasets: [
      {
        data: [
          satisfaction.distribution.excellent,
          satisfaction.distribution.good,
          satisfaction.distribution.average,
          satisfaction.distribution.poor,
          satisfaction.distribution.veryPoor
        ],
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#f97316',
          '#ef4444'
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Overall Satisfaction"
          value={satisfaction.satisfactionScore}
          suffix="%"
          color="green"
        />
        <MetricCard
          title="NPS Score"
          value={satisfaction.nps}
          color="blue"
        />
        <MetricCard
          title="Would Recommend"
          value={satisfaction.recommendationRate}
          suffix="%"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rating Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(satisfaction.averageRatings).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-semibold text-gray-900">{value}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(value / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Satisfaction Distribution
          </h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={distributionData} options={{ maintainAspectRatio: true }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Total Feedbacks:</strong> {satisfaction.totalFeedbacks} responses collected
        </p>
      </div>
    </div>
  );
};

// Budget Tab Component
const BudgetTab = ({ budgetImpact }) => {
  const categoryData = Object.entries(budgetImpact.categoryBreakdown);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Estimated Cost"
          value={`$${(budgetImpact.totalEstimatedCost / 1000).toFixed(1)}K`}
          color="indigo"
        />
        <MetricCard
          title="Resolved Cost"
          value={`$${(budgetImpact.totalResolvedCost / 1000).toFixed(1)}K`}
          color="green"
        />
        <MetricCard
          title="Pending Cost"
          value={`$${(budgetImpact.totalPendingCost / 1000).toFixed(1)}K`}
          color="orange"
        />
        <MetricCard
          title="Cost Efficiency"
          value={budgetImpact.costEfficiency}
          suffix="%"
          color="blue"
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Budget by Category
        </h3>
        <div className="space-y-4">
          {categoryData.map(([category, data]) => (
            <div key={category} className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 capitalize">
                  {category.replace('_', ' ')}
                </h4>
                <span className="text-sm text-gray-500">
                  {data.count} complaints
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-semibold text-gray-900">
                    ${(data.estimatedCost / 1000).toFixed(1)}K
                  </p>
                  <p className="text-gray-500">Total</p>
                </div>
                <div>
                  <p className="font-semibold text-green-600">
                    ${(data.resolvedCost / 1000).toFixed(1)}K
                  </p>
                  <p className="text-gray-500">Resolved</p>
                </div>
                <div>
                  <p className="font-semibold text-orange-600">
                    ${(data.pendingCost / 1000).toFixed(1)}K
                  </p>
                  <p className="text-gray-500">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          <strong>Projected Monthly Cost:</strong> ${(budgetImpact.projectedMonthlyCost / 1000).toFixed(1)}K
          based on current trends
        </p>
      </div>
    </div>
  );
};

// Reusable Metric Card Component
const MetricCard = ({ title, value, suffix = '', color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'text-indigo-600 bg-indigo-50',
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-2">
        {value}{suffix}
      </p>
    </div>
  );
};

export default AnalyticsDashboard;
