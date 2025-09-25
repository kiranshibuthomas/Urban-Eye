// Global navigation blocker to prevent rapid back button access
class NavigationBlocker {
  constructor() {
    this.isBlocking = false;
    this.blockedPaths = ['/citizen-dashboard', '/admin-dashboard', '/field-staff-dashboard', '/profile', '/reports-history', '/report-issue', '/settings'];
    this.allowedPaths = ['/login', '/register', '/'];
    this.init();
  }

  init() {
    // Add global popstate listener
    window.addEventListener('popstate', this.handlePopState.bind(this));
    
    // Add beforeunload listener to set blocking flag
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  handlePopState(event) {
    const currentPath = window.location.pathname;
    const isLoggedOut = sessionStorage.getItem('user_logged_out') === 'true';
    const token = localStorage.getItem('token');
    
    // If user is logged out or has no token, block all protected navigation
    if (isLoggedOut || !token) {
      if (this.blockedPaths.some(path => currentPath.startsWith(path))) {
        this.blockNavigation();
      }
    }
  }

  handleBeforeUnload() {
    // Set blocking flag when page is about to unload
    this.isBlocking = true;
  }

  blockNavigation() {
    // Aggressively block navigation
    window.history.replaceState(null, '', '/login');
    
    // Add multiple history entries to create a "wall"
    for (let i = 0; i < 10; i++) {
      window.history.pushState(null, '', '/login');
    }
    
    // Force redirect
    window.location.href = '/login';
  }

  setLoggedOut() {
    sessionStorage.setItem('user_logged_out', 'true');
  }

  clearLoggedOut() {
    sessionStorage.removeItem('user_logged_out');
  }

  destroy() {
    window.removeEventListener('popstate', this.handlePopState.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }
}

// Create global instance
const navigationBlocker = new NavigationBlocker();

// Make it globally available
window.navigationBlocker = navigationBlocker;

export default navigationBlocker;
