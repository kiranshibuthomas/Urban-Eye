// Cache busting utility to prevent browser caching of protected pages
export const addCacheBustingHeaders = () => {
  // Add meta tags to prevent caching
  const metaTags = [
    { name: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
    { name: 'Pragma', content: 'no-cache' },
    { name: 'Expires', content: '0' }
  ];

  metaTags.forEach(tag => {
    let meta = document.querySelector(`meta[name="${tag.name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = tag.name;
      document.head.appendChild(meta);
    }
    meta.content = tag.content;
  });
};

// Clear browser cache for current page
export const clearPageCache = () => {
  // Force reload without cache
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Clear any stored data
  sessionStorage.clear();
  
  // Add cache busting headers
  addCacheBustingHeaders();
};

// Prevent back button access to protected pages
export const preventBackButtonAccess = () => {
  // Clear browser history
  window.history.replaceState(null, '', window.location.href);
  
  // Add popstate listener to block back navigation
  const handlePopState = (event) => {
    const currentPath = window.location.pathname;
    const isLoggedOut = sessionStorage.getItem('user_logged_out') === 'true';
    const token = localStorage.getItem('token');
    
    // If user is logged out or has no token, block all navigation
    if (isLoggedOut || !token) {
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        // Aggressively block navigation
        window.history.replaceState(null, '', '/login');
        
        // Add multiple history entries to prevent further back navigation
        for (let i = 0; i < 5; i++) {
          window.history.pushState(null, '', '/login');
        }
        
        // Force redirect
        window.location.href = '/login';
      }
    }
  };
  
  window.addEventListener('popstate', handlePopState);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
};
