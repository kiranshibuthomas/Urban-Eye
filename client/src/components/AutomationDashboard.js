import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon, 
  PlayIcon, 
  StopIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AutomationDashboard = () => {
  const [automationStats, setAutomationStats] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, statusResponse] = await Promise.all([
        fetch('/api/complaints/automation-stats', {
          credentials: 'include'
        }),
        fetch('/api/scheduler/status', {
          credentials: 'include'
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setAutomationStats(statsData.stats);
      }

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSchedulerStatus(statusData.status);
      }
    } catch (error) {
      console.error('Error fetching automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/complaints/process-pending', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Processing completed: ${result.result.successful}/${result.result.processed} successful`);
        fetchData(); // Refresh data
      } else {
        alert('Failed to process pending complaints');
      }
    } catch (error) {
      console.error('Error processing pending complaints:', error);
      alert('Error processing pending complaints');
    } finally {
      setProcessing(false);
    }
  };

  const handleSchedulerControl = async (action) => {
    try {
      const response = await fetch(`/api/scheduler/${action}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        alert(`Scheduler ${action} successful`);
        fetchData(); // Refresh data
      } else {
        alert(`Failed to ${action} scheduler`);
      }
    } catch (error) {
      console.error(`Error ${action} scheduler:`, error);
      alert(`Error ${action} scheduler`);
    }
  };

  const handleTriggerJob = async (jobName) => {
    try {
      const response = await fetch(`/api/scheduler/trigger/${jobName}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Job ${jobName} triggered successfully`);
        fetchData(); // Refresh data
      } else {
        alert(`Failed to trigger job ${jobName}`);
      }
    } catch (error) {
      console.error(`Error triggering job ${jobName}:`, error);
      alert(`Error triggering job ${jobName}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading automation data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Automation Dashboard</h2>
            <p className="text-gray-600">Monitor and control automated complaint processing</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleSchedulerControl('start')}
            disabled={schedulerStatus?.isRunning}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Start Scheduler
          </button>
          <button
            onClick={() => handleSchedulerControl('stop')}
            disabled={!schedulerStatus?.isRunning}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <StopIcon className="h-4 w-4 mr-2" />
            Stop Scheduler
          </button>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduler Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${schedulerStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              Status: {schedulerStatus?.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Jobs: {schedulerStatus?.jobs?.length || 0}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm">
              Next Run: {schedulerStatus?.jobs?.[0]?.nextRun ? 
                new Date(schedulerStatus.jobs[0].nextRun).toLocaleTimeString() : 
                'N/A'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Automation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Automated</p>
              <p className="text-2xl font-bold text-gray-900">
                {automationStats?.totalAutomated || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {automationStats?.totalErrors || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {automationStats?.successRate ? 
                  `${automationStats.successRate.toFixed(1)}%` : 
                  '0%'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleProcessPending}
            disabled={processing}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CpuChipIcon className="h-4 w-4 mr-2" />
            )}
            Process Pending Complaints
          </button>

          <button
            onClick={() => handleTriggerJob('complaintProcessing')}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Trigger Processing Job
          </button>

          <button
            onClick={() => handleTriggerJob('healthCheck')}
            className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Run Health Check
          </button>
        </div>
      </div>

      {/* Job Status */}
      {schedulerStatus?.jobs && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Jobs</h3>
          <div className="space-y-3">
            {schedulerStatus.jobs.map((job, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${job.running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="font-medium">{job.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {job.nextRun ? `Next: ${new Date(job.nextRun).toLocaleString()}` : 'Not scheduled'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Automation Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Complaints are automatically processed every 5 minutes</li>
                <li>AI analyzes text and images to determine category and priority</li>
                <li>Field staff are automatically assigned based on category and workload</li>
                <li>All automation actions are logged in the audit system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationDashboard;
