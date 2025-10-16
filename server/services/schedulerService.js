const cron = require('node-cron');
const AutomationService = require('./automationService');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the scheduler service
   */
  start() {
    if (this.isRunning) {
      // Scheduler service is already running
      return;
    }

    // Starting scheduler service

    // Schedule automated complaint processing every 5 minutes
    const complaintProcessingJob = cron.schedule('*/5 * * * *', async () => {
      try {
        // Running scheduled complaint processing
        const result = await AutomationService.processPendingComplaints();
        
        if (result.processed > 0) {
          // Scheduled processing completed
        }
      } catch (error) {
        console.error('Scheduled complaint processing error:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set('complaintProcessing', complaintProcessingJob);

    // Schedule system health check every hour
    const healthCheckJob = cron.schedule('0 * * * *', async () => {
      try {
        // Running system health check
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set('healthCheck', healthCheckJob);

    // Start all jobs
    this.jobs.forEach((job, name) => {
      job.start();
      // Started scheduled job
    });

    this.isRunning = true;
    // Scheduler service started successfully
  }

  /**
   * Stop the scheduler service
   */
  stop() {
    if (!this.isRunning) {
      // Scheduler service is not running
      return;
    }

    // Stopping scheduler service

    this.jobs.forEach((job, name) => {
      job.stop();
      // Stopped scheduled job
    });

    this.jobs.clear();
    this.isRunning = false;
    // Scheduler service stopped
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: []
    };

    this.jobs.forEach((job, name) => {
      status.jobs.push({
        name,
        running: job.running,
        nextRun: job.nextDate ? job.nextDate().toISOString() : null
      });
    });

    return status;
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      // Check automation statistics
      const automationStats = await AutomationService.getAutomationStats();
      
      // Log health status
      // System Health Check completed

      // Alert if error rate is too high
      if (automationStats.successRate < 80 && automationStats.totalAutomated > 10) {
        // High automation error rate detected
        // Here you could send alerts to administrators
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Manually trigger a job
   * @param {string} jobName - Name of the job to trigger
   */
  async triggerJob(jobName) {
    try {
      switch (jobName) {
        case 'complaintProcessing':
          // Manually triggering complaint processing
          const result = await AutomationService.processPendingComplaints();
          // Manual complaint processing completed
          return result;

        case 'healthCheck':
          // Manually triggering health check
          await this.performHealthCheck();
          // Manual health check completed
          return { success: true };

        default:
          throw new Error(`Unknown job: ${jobName}`);
      }
    } catch (error) {
      console.error(`Error triggering job ${jobName}:`, error);
      throw error;
    }
  }

  /**
   * Add a new scheduled job
   * @param {string} name - Job name
   * @param {string} schedule - Cron schedule expression
   * @param {Function} task - Task function to execute
   */
  addJob(name, schedule, task) {
    if (this.jobs.has(name)) {
      throw new Error(`Job ${name} already exists`);
    }

    const job = cron.schedule(schedule, task, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set(name, job);

    if (this.isRunning) {
      job.start();
      // Added and started new job
    } else {
      // Added new job (will start when scheduler starts)
    }

    return job;
  }

  /**
   * Remove a scheduled job
   * @param {string} name - Job name
   */
  removeJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }

    job.stop();
    this.jobs.delete(name);
    // Removed job
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
