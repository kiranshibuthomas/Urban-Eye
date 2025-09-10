const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stats/platform
// @desc    Get platform-wide statistics
// @access  Private
router.get('/platform', authenticateToken, async (req, res) => {
  try {
    // Get platform statistics
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const activeCitizens = await User.countDocuments({ role: 'citizen' });
    
    // Calculate resolution rate
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
    
    // Calculate average response time (mock data for now)
    const responseTime = 24; // hours
    
    // Calculate satisfaction rate (mock data for now)
    const satisfaction = 85; // percentage

    res.json({
      success: true,
      stats: {
        totalComplaints,
        resolvedComplaints,
        activeCitizens,
        resolutionRate,
        responseTime,
        satisfaction
      }
    });

  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching platform statistics'
    });
  }
});

module.exports = router;
