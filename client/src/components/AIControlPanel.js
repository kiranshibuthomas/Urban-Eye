import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon, 
  CogIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AIControlPanel = () => {
  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    maxDailyCost: 10,
    maxMonthlyCost: 50,
    maxComplaintsPerDay: 500,
    useFallbackOnError: true,
    imageAnalysisEnabled: true,
    businessHoursOnly: false
  });
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    todayComplaints: 0,
    todayCost: 0,
    monthlyCost: 0,
    aiSuccessRate: 0,
    fallbackUsage: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // This would be an API call to get current stats
      // For now, using mock data
      setStats({
        todayComplaints: 45,
        todayCost: 0.90,
        monthlyCost: 12.50,
        aiSuccessRate: 85,
        fallbackUsage: 15
      });
    } catch (error) {
      console.error('Error fetching AI stats:', error);
    }
  };

  const handleConfigChange = (key, value) => {
    setAiConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      // This would be an API call to save the configuration
      console.log('Saving AI config:', aiConfig);
      // await fetch('/api/ai/config', { method: 'POST', body: JSON.stringify(aiConfig) });
      alert('AI configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleAI = () => {
    const newEnabled = !aiConfig.enabled;
    setAiConfig(prev => ({ ...prev, enabled: newEnabled }));
    
    if (newEnabled) {
      alert('AI analysis enabled. The system will use AI for complaint categorization and priority detection.');
    } else {
      alert('AI analysis disabled. The system will use keyword-based fallback analysis.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Control Panel</h2>
            <p className="text-gray-600">Manage AI usage, costs, and automation settings</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            aiConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {aiConfig.enabled ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
            <span className="font-medium">
              AI {aiConfig.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <button
            onClick={toggleAI}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              aiConfig.enabled 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {aiConfig.enabled ? 'Disable AI' : 'Enable AI'}
          </button>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Complaints</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayComplaints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Cost</p>
              <p className="text-2xl font-bold text-gray-900">${stats.todayCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
              <p className="text-2xl font-bold text-gray-900">${stats.monthlyCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.aiSuccessRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <CogIcon className="h-6 w-6 text-gray-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">AI Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cost Controls */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Cost Controls</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Cost ($)
              </label>
              <input
                type="number"
                value={aiConfig.maxDailyCost}
                onChange={(e) => handleConfigChange('maxDailyCost', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Monthly Cost ($)
              </label>
              <input
                type="number"
                value={aiConfig.maxMonthlyCost}
                onChange={(e) => handleConfigChange('maxMonthlyCost', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Complaints Per Day
              </label>
              <input
                type="number"
                value={aiConfig.maxComplaintsPerDay}
                onChange={(e) => handleConfigChange('maxComplaintsPerDay', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>

          {/* Feature Controls */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Feature Controls</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Use Fallback on Error</label>
                <p className="text-xs text-gray-500">Use keyword analysis when AI fails</p>
              </div>
              <input
                type="checkbox"
                checked={aiConfig.useFallbackOnError}
                onChange={(e) => handleConfigChange('useFallbackOnError', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Image Analysis</label>
                <p className="text-xs text-gray-500">Analyze uploaded images with AI</p>
              </div>
              <input
                type="checkbox"
                checked={aiConfig.imageAnalysisEnabled}
                onChange={(e) => handleConfigChange('imageAnalysisEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Business Hours Only</label>
                <p className="text-xs text-gray-500">Use AI only during business hours</p>
              </div>
              <input
                type="checkbox"
                checked={aiConfig.businessHoursOnly}
                onChange={(e) => handleConfigChange('businessHoursOnly', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              AI Usage Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Current Status:</strong> {aiConfig.enabled ? 'AI analysis is active' : 'Using fallback keyword analysis'}</li>
                <li><strong>Fallback System:</strong> Always available when AI is unavailable or disabled</li>
                <li><strong>Cost Control:</strong> Automatic fallback when limits are reached</li>
                <li><strong>Success Rate:</strong> {stats.aiSuccessRate}% AI accuracy, {stats.fallbackUsage}% fallback usage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIControlPanel;

