import { toast } from 'react-hot-toast';

class SessionManager {
  constructor() {
    this.refreshTimer = null;
    this.warningTimer = null;
    this.sessionTimeout = 10 * 60 * 1000; // 10 minutes
    this.warningTime = 2 * 60 * 1000; // 2 minutes before timeout
    this.refreshInterval = 5 * 60 * 1000; // Refresh every 5 minutes
    this.isRefreshing = false;
    this.listeners = new Set();
    this.lastActivity = Date.now();
    this.isActive = true;
    
    this.init();
  }

  init() {
    // Set up activity tracking
    this.setupActivityTracking();
    
    // Set up storage event listener for multi-tab sync
    this.setupStorageListener();
    
    // Set up visibility change listener
    this.setupVisibilityListener();
    
    // Start session monitoring (with delay to avoid interfering with login)
    setTimeout(() => {
      this.startSessionMonitoring();
    }, 2000);
  }

  // Add event listener for session events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of session events
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  // Set up activity tracking
  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.isActive = true;
      this.notifyListeners('activity', { lastActivity: this.lastActivity });
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
  }

  // Set up storage event listener for multi-tab synchronization
  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'session_logout') {
        this.handleLogout('Session ended in another tab');
      } else if (e.key === 'session_refresh') {
        this.handleTokenRefresh(JSON.parse(e.newValue));
      }
    });
  }

  // Set up visibility change listener
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
      } else {
        this.isActive = true;
        this.lastActivity = Date.now();
        this.checkSessionStatus();
      }
    });
  }

  // Start session monitoring
  startSessionMonitoring() {
    // Check session status every minute
    setInterval(() => {
      this.checkSessionStatus();
    }, 60000);

    // Start token refresh timer
    this.startTokenRefresh();
  }

  // Check session status and handle timeouts
  checkSessionStatus() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeUntilTimeout = this.sessionTimeout - timeSinceActivity;

    if (timeSinceActivity >= this.sessionTimeout) {
      this.handleSessionTimeout();
    } else if (timeUntilTimeout <= this.warningTime && timeUntilTimeout > 0) {
      this.showSessionWarning(timeUntilTimeout);
    }
  }

  // Show session warning
  showSessionWarning(timeRemaining) {
    const minutes = Math.ceil(timeRemaining / 60000);
    
    if (!this.warningShown) {
      this.warningShown = true;
      
      toast.error(
        `Your session will expire in ${minutes} minute${minutes > 1 ? 's' : ''}. Click anywhere to extend your session.`,
        {
          duration: 10000,
          id: 'session-warning'
        }
      );

      // Set up one-time activity listener to dismiss warning
      const dismissWarning = () => {
        this.warningShown = false;
        toast.dismiss('session-warning');
        this.lastActivity = Date.now();
        document.removeEventListener('click', dismissWarning);
        document.removeEventListener('keypress', dismissWarning);
      };

      document.addEventListener('click', dismissWarning, { once: true });
      document.addEventListener('keypress', dismissWarning, { once: true });
    }
  }

  // Handle session timeout
  handleSessionTimeout() {
    this.notifyListeners('timeout', { reason: 'Session timeout due to inactivity' });
    this.handleLogout('Your session has expired due to inactivity');
  }

  // Start automatic token refresh
  startTokenRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      if (this.isActive && !this.isRefreshing) {
        await this.refreshToken();
      }
    }, this.refreshInterval);
  }

  // Refresh authentication token
  async refreshToken() {
    if (this.isRefreshing) return;

    this.isRefreshing = true;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update last activity
          this.lastActivity = Date.now();
          
          // Notify other tabs
          localStorage.setItem('session_refresh', JSON.stringify({
            timestamp: Date.now(),
            token: data.token
          }));

          this.notifyListeners('refresh', { token: data.token });
          console.log('Token refreshed successfully');
        }
      } else if (response.status === 401) {
        // Token refresh failed, logout
        this.handleLogout('Session expired');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Don't logout on network errors, just log the error
    } finally {
      this.isRefreshing = false;
    }
  }

  // Handle token refresh from another tab
  handleTokenRefresh(data) {
    this.lastActivity = Date.now();
    this.notifyListeners('refresh', data);
  }

  // Handle logout
  handleLogout(reason = 'Logged out') {
    // Clear timers
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    // Clear session data
    localStorage.removeItem('session_refresh');
    localStorage.setItem('session_logout', Date.now().toString());

    // Notify listeners
    this.notifyListeners('logout', { reason });

    // Show logout message
    if (reason !== 'Logged out') {
      toast.error(reason);
    }
  }

  // Manual logout
  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.handleLogout('Logged out');
    }
  }

  // Extend session manually
  extendSession() {
    this.lastActivity = Date.now();
    this.warningShown = false;
    toast.dismiss('session-warning');
    this.notifyListeners('extend', { lastActivity: this.lastActivity });
  }

  // Get session status
  getSessionStatus() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeUntilTimeout = this.sessionTimeout - timeSinceActivity;

    return {
      isActive: this.isActive,
      lastActivity: this.lastActivity,
      timeSinceActivity,
      timeUntilTimeout,
      isExpired: timeSinceActivity >= this.sessionTimeout,
      isWarning: timeUntilTimeout <= this.warningTime && timeUntilTimeout > 0
    };
  }


  // Cleanup
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    
    // Remove event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.updateActivity, true);
    });

    window.removeEventListener('storage', this.setupStorageListener);
    document.removeEventListener('visibilitychange', this.setupVisibilityListener);
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
