const express = require('express');
const schedulerService = require('../services/schedulerService');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/scheduler/status
// @desc    Get scheduler service status (Admin only)
// @access  Private (Admin only)
router.get('/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const status = schedulerService.getStatus();
    
    res.json({
      success: true,
      status
    });
    
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scheduler status'
    });
  }
});

// @route   POST /api/scheduler/start
// @desc    Start scheduler service (Admin only)
// @access  Private (Admin only)
router.post('/start', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    schedulerService.start();
    
    res.json({
      success: true,
      message: 'Scheduler service started successfully'
    });
    
  } catch (error) {
    console.error('Start scheduler error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting scheduler'
    });
  }
});

// @route   POST /api/scheduler/stop
// @desc    Stop scheduler service (Admin only)
// @access  Private (Admin only)
router.post('/stop', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    schedulerService.stop();
    
    res.json({
      success: true,
      message: 'Scheduler service stopped successfully'
    });
    
  } catch (error) {
    console.error('Stop scheduler error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while stopping scheduler'
    });
  }
});

// @route   POST /api/scheduler/trigger/:jobName
// @desc    Manually trigger a scheduled job (Admin only)
// @access  Private (Admin only)
router.post('/trigger/:jobName', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { jobName } = req.params;
    
    const result = await schedulerService.triggerJob(jobName);
    
    res.json({
      success: true,
      message: `Job ${jobName} triggered successfully`,
      result
    });
    
  } catch (error) {
    console.error('Trigger job error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while triggering job'
    });
  }
});

module.exports = router;
