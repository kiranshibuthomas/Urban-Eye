const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics data for charts
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Get current date and calculate dates for analysis
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // 1. TREND DATA (Last 7 days)
    const trendData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Count complaints submitted on this day
      const complaintsSubmitted = await Complaint.countDocuments({
        submittedAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      // Count complaints resolved on this day (regardless of when they were submitted)
      const complaintsResolved = await Complaint.countDocuments({
        status: 'resolved',
        resolvedAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      trendData.push({
        name: dayNames[startOfDay.getDay()],
        complaints: complaintsSubmitted,
        resolved: complaintsResolved
      });
    }
    
    console.log('📊 Analytics Trend Data Generated:', JSON.stringify(trendData, null, 2));
    
    // If no data exists, provide a helpful empty state
    if (trendData.every(day => day.complaints === 0 && day.resolved === 0)) {
      console.log('ℹ️  No complaint data found for the last 7 days');
    }

    res.status(200).json({
      success: true,
      data: {
        trendData
      }
    });

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
});

module.exports = router;

