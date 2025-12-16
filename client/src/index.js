import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import performanceMonitor from './utils/performanceMonitor';
import './i18n/i18n'; // Initialize i18n

// Initialize performance monitoring
performanceMonitor.mark('app-start');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mark when React finishes rendering
performanceMonitor.mark('app-rendered');
performanceMonitor.measure('app-initialization', 'app-start', 'app-rendered');

// Log metrics after everything loads
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logAllMetrics();
    }, 1000);
  });
}
