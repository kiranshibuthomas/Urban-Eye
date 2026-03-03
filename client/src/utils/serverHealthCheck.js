/**
 * Server Health Check Utility
 * Checks if the backend server is running and accessible
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

/**
 * Check if server is running
 * @returns {Promise<{isRunning: boolean, message: string}>}
 */
export const checkServerHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${SERVER_URL}/api/test`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        isRunning: true,
        message: 'Server is running'
      };
    } else {
      return {
        isRunning: false,
        message: `Server responded with status: ${response.status}`
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        isRunning: false,
        message: 'Server connection timeout',
        error: 'TIMEOUT'
      };
    }

    return {
      isRunning: false,
      message: 'Server is not running or not accessible',
      error: error.message
    };
  }
};

/**
 * Display helpful error message when server is not running
 */
export const showServerErrorHelp = () => {
  console.group('🔴 Backend Server Not Running');
  console.error('The backend server is not accessible at:', SERVER_URL);
  console.log('\n📋 To fix this issue:');
  console.log('1. Open a new terminal');
  console.log('2. Navigate to your project directory');
  console.log('3. Run one of these commands:');
  console.log('   • npm run dev          (starts both client and server)');
  console.log('   • npm run server       (starts only server)');
  console.log('   • cd server && npm start');
  console.log('\n🔍 Troubleshooting:');
  console.log('• Check if port 5000 is already in use');
  console.log('• Verify MongoDB connection in server/.env');
  console.log('• Check server logs for errors');
  console.log('• Ensure all dependencies are installed: npm run install-all');
  console.groupEnd();
};

/**
 * Monitor server connection status
 * @param {Function} onStatusChange - Callback when status changes
 * @returns {Function} Cleanup function to stop monitoring
 */
export const monitorServerConnection = (onStatusChange) => {
  let isRunning = false;
  let checkCount = 0;
  const maxChecks = 5; // Stop after 5 failed checks

  const checkInterval = setInterval(async () => {
    const health = await checkServerHealth();
    
    if (health.isRunning !== isRunning) {
      isRunning = health.isRunning;
      onStatusChange(health);
      
      if (isRunning) {
        // Server is back online, reset counter
        checkCount = 0;
      }
    }

    if (!health.isRunning) {
      checkCount++;
      if (checkCount >= maxChecks) {
        // Stop checking after max attempts
        clearInterval(checkInterval);
        console.warn('⚠️ Stopped checking server status after', maxChecks, 'attempts');
      }
    }
  }, 5000); // Check every 5 seconds

  // Return cleanup function
  return () => clearInterval(checkInterval);
};

/**
 * Get user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} User-friendly message
 */
export const getServerErrorMessage = (error) => {
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
    return 'Cannot connect to server. Please ensure the backend is running.';
  }
  
  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection and ensure the server is running.';
  }
  
  if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  }
  
  if (error.response?.status === 503) {
    return 'Server is temporarily unavailable. Please try again later.';
  }
  
  return error.response?.data?.message || error.message || 'An error occurred';
};

export default {
  checkServerHealth,
  showServerErrorHelp,
  monitorServerConnection,
  getServerErrorMessage
};
