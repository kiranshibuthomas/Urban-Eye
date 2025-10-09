/**
 * Performance Monitoring Utilities
 * Tracks and reports performance metrics for the application
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigationTiming: {},
      resourceTiming: [],
      customMarks: {},
      vitals: {}
    };
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (!this.enabled || typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor layout shifts
    this.observeLayoutShifts();

    // Log initial metrics after page load
    if (document.readyState === 'complete') {
      this.logNavigationTiming();
    } else {
      window.addEventListener('load', () => this.logNavigationTiming());
    }
  }

  /**
   * Observe Core Web Vitals (LCP, FID, CLS)
   */
  observeWebVitals() {
    try {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
          
          if (this.enabled) {
            console.log('📊 LCP:', this.metrics.vitals.LCP.toFixed(2), 'ms');
          }
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.vitals.FID = entry.processingStart - entry.startTime;
            
            if (this.enabled) {
              console.log('📊 FID:', this.metrics.vitals.FID.toFixed(2), 'ms');
            }
          });
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          // FID not supported
        }

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.vitals.CLS = clsValue;
            }
          });
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // CLS not supported
        }
      }
    } catch (error) {
      console.warn('Error observing web vitals:', error);
    }
  }

  /**
   * Observe long tasks (> 50ms)
   */
  observeLongTasks() {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (this.enabled) {
              console.warn('⚠️ Long Task detected:', {
                duration: entry.duration.toFixed(2) + 'ms',
                startTime: entry.startTime.toFixed(2) + 'ms'
              });
            }
          });
        });

        try {
          observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          // Long task monitoring not supported
        }
      }
    } catch (error) {
      console.warn('Error observing long tasks:', error);
    }
  }

  /**
   * Observe layout shifts
   */
  observeLayoutShifts() {
    try {
      if ('PerformanceObserver' in window) {
        let cumulativeScore = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              cumulativeScore += entry.value;
              if (this.enabled && entry.value > 0.1) {
                console.warn('⚠️ Layout Shift detected:', {
                  value: entry.value.toFixed(4),
                  cumulative: cumulativeScore.toFixed(4)
                });
              }
            }
          });
        });

        try {
          observer.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // Layout shift monitoring not supported
        }
      }
    } catch (error) {
      console.warn('Error observing layout shifts:', error);
    }
  }

  /**
   * Log navigation timing metrics
   */
  logNavigationTiming() {
    if (!this.enabled || !window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = {
      'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
      'TCP Connection': timing.connectEnd - timing.connectStart,
      'Request Time': timing.responseStart - timing.requestStart,
      'Response Time': timing.responseEnd - timing.responseStart,
      'DOM Processing': timing.domComplete - timing.domLoading,
      'Load Complete': timing.loadEventEnd - timing.navigationStart,
      'DOM Content Loaded': timing.domContentLoadedEventEnd - timing.navigationStart,
      'Time to Interactive': timing.domInteractive - timing.navigationStart
    };

    this.metrics.navigationTiming = navigation;

    console.log('📊 Navigation Timing:', navigation);

    // Check for performance issues
    if (navigation['Load Complete'] > 3000) {
      console.warn('⚠️ Slow page load detected:', navigation['Load Complete'], 'ms');
    }

    if (navigation['Time to Interactive'] > 2000) {
      console.warn('⚠️ Slow time to interactive:', navigation['Time to Interactive'], 'ms');
    }
  }

  /**
   * Mark a custom performance point
   */
  mark(name) {
    if (!this.enabled || !window.performance || !window.performance.mark) return;

    try {
      window.performance.mark(name);
      this.metrics.customMarks[name] = Date.now();
    } catch (error) {
      console.warn('Error creating performance mark:', error);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name, startMark, endMark) {
    if (!this.enabled || !window.performance || !window.performance.measure) return;

    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      
      if (this.enabled) {
        console.log(`⏱️ ${name}:`, measure.duration.toFixed(2), 'ms');
      }

      return measure.duration;
    } catch (error) {
      console.warn('Error measuring performance:', error);
      return null;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Log all metrics
   */
  logAllMetrics() {
    if (!this.enabled) return;

    console.group('📊 Performance Metrics');
    console.log('Navigation Timing:', this.metrics.navigationTiming);
    console.log('Core Web Vitals:', this.metrics.vitals);
    console.log('Custom Marks:', this.metrics.customMarks);
    console.groupEnd();
  }

  /**
   * Enable performance monitoring
   */
  enable() {
    this.enabled = true;
    this.init();
  }

  /**
   * Disable performance monitoring
   */
  disable() {
    this.enabled = false;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.init();
}

export default performanceMonitor;

// Export utility functions
export const {
  mark: perfMark,
  measure: perfMeasure,
  getMetrics: getPerfMetrics,
  logAllMetrics: logPerfMetrics
} = performanceMonitor;

