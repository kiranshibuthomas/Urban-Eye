import React, { useState, useEffect } from 'react';
import { FiClock, FiRefreshCw, FiLogOut } from 'react-icons/fi';
import sessionManager from '../services/sessionManager';

const SessionTimeoutWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    const handleSessionEvent = (event, data) => {
      switch (event) {
        case 'warning':
          setShowWarning(true);
          setTimeRemaining(data.timeRemaining);
          break;
        case 'activity':
        case 'extend':
          setShowWarning(false);
          break;
        case 'logout':
        case 'timeout':
          setShowWarning(false);
          break;
        default:
          break;
      }
    };

    // Add session event listener
    const removeListener = sessionManager.addListener(handleSessionEvent);

    return removeListener;
  }, []);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await sessionManager.refreshToken();
      sessionManager.extendSession();
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = () => {
    sessionManager.logout();
    setShowWarning(false);
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.ceil(milliseconds / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <FiClock className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-gray-600">
              Your session will expire in {formatTime(timeRemaining)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700">
            You will be automatically logged out due to inactivity. 
            Would you like to extend your session?
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtending ? (
              <>
                <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Extend Session
              </>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <FiLogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Click anywhere outside this dialog to extend your session
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;