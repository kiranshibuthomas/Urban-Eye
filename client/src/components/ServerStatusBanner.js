import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiRefreshCw, FiCheckCircle, FiX } from 'react-icons/fi';
import { checkServerHealth } from '../utils/serverHealthCheck';

const ServerStatusBanner = () => {
  const [serverStatus, setServerStatus] = useState({ isRunning: true, checking: true });
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Initial check
    checkStatus();

    // Check every 10 seconds if server is down
    const interval = setInterval(() => {
      if (!serverStatus.isRunning) {
        checkStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [serverStatus.isRunning]);

  const checkStatus = async () => {
    setIsChecking(true);
    const health = await checkServerHealth();
    setServerStatus({ ...health, checking: false });
    setIsChecking(false);
    
    // If server is back online, clear dismissed state
    if (health.isRunning) {
      setIsDismissed(false);
    }
  };

  const handleRetry = () => {
    checkStatus();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show banner if server is running, still checking, or dismissed
  if (serverStatus.isRunning || serverStatus.checking || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Backend Server Not Running</p>
              <p className="text-sm text-red-100 mt-1">
                Cannot connect to the server. Please start the backend server to continue.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {isChecking ? 'Checking...' : 'Retry'}
              </span>
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-red-700 rounded-lg transition-colors"
              title="Dismiss"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-3 pt-3 border-t border-red-500">
          <p className="text-sm font-medium mb-2">To start the server:</p>
          <div className="bg-red-700 rounded-lg p-3 font-mono text-sm">
            <p>npm run dev</p>
            <p className="text-red-200 text-xs mt-1">or</p>
            <p>cd server && npm start</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatusBanner;
