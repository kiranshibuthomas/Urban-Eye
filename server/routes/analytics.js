const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const analyticsService = require('../services/analyticsService');
const ComplaintFeedback = require('../models/ComplaintFeedback');
const Complaint = require('../models/Complaint');

// ==================== ADMIN ANALYTICS ROUTES ====================

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard analytics
 */
router.get('/dashboard', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { timeRange = 30 } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics({
      timeRange: parseInt(timeRange)
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/hotspots
 * Get predicted complaint hotspots
 */
router.get('/hotspots', authenticateToken, adminAuth, async (req, res) => {
  try {
    const {
      timeRange = 30,
      minComplaintsThreshold = 5,
      radiusKm = 1
    } = req.query;

    const hotspots = await analyticsService.predictHotspots({
      timeRange: parseInt(timeRange),
      minComplaintsThreshold: parseInt(minComplaintsThreshold),
      radiusKm: parseFloat(radiusKm)
    });

    res.json({
      success: true,
      data: hotspots
    });
  } catch (error) {
    console.error('Error fetching hotspots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotspots',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/trends
 * Get trend analysis
 */
router.get('/trends', authenticateToken, adminAuth, async (req, res) => {
  try {
    const {
      timeRange = 90,
      groupBy = 'day',
      category,
      priority
    } = req.query;

    const trends = await analyticsService.getTrendAnalysis({
      timeRange: parseInt(timeRange),
      groupBy,
      category,
      priority
    });

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/field-staff-performance
 * Get field staff performance metrics
 */
router.get('/field-staff-performance', authenticateToken, adminAuth, async (req, res) => {
  try {
    const {
      fieldStaffId,
      timeRange = 30,
      includeDetails = false
    } = req.query;

    const performance = await analyticsService.getFieldStaffPerformance(
      fieldStaffId || null,
      {
        timeRange: parseInt(timeRange),
        includeDetails: includeDetails === 'true'
      }
    );

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching field staff performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch field staff performance',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/satisfaction
 * Get citizen satisfaction metrics
 */
router.get('/satisfaction', authenticateToken, adminAuth, async (req, res) => {
  try {
    const {
      timeRange = 30,
      category,
      department
    } = req.query;

    const satisfaction = await analyticsService.getCitizenSatisfaction({
      timeRange: parseInt(timeRange),
      category,
      department
    });

    res.json({
      success: true,
      data: satisfaction
    });
  } catch (error) {
    console.error('Error fetching satisfaction metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch satisfaction metrics',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/budget-impact
 * Get budget impact analysis
 */
router.get('/budget-impact', authenticateToken, adminAuth, async (req, res) => {
  try {
    const {
      timeRange = 30,
      category
    } = req.query;

    const budgetImpact = await analyticsService.getBudgetImpact({
      timeRange: parseInt(timeRange),
      category
    });

    res.json({
      success: true,
      data: budgetImpact
    });
  } catch (error) {
    console.error('Error fetching budget impact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget impact',
      error: error.message
    });
  }
});

// ==================== FEEDBACK ROUTES ====================

/**
 * POST /api/analytics/feedback
 * Submit feedback for a resolved complaint
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const {
      complaintId,
      overallSatisfaction,
      responseTime,
      workQuality,
      communication,
      professionalism,
      comment,
      wouldRecommend,
      isAnonymous
    } = req.body;

    // Validate complaint exists and is resolved
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!['resolved', 'work_completed'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only provide feedback for resolved complaints'
      });
    }

    // Check if user is the complaint owner
    if (complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback for your own complaints'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await ComplaintFeedback.findOne({
      complaint: complaintId,
      citizen: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this complaint'
      });
    }

    // Create feedback
    const feedback = new ComplaintFeedback({
      complaint: complaintId,
      citizen: req.user._id,
      overallSatisfaction,
      responseTime,
      workQuality,
      communication,
      professionalism,
      comment,
      wouldRecommend: wouldRecommend !== false,
      isAnonymous: isAnonymous === true
    });

    await feedback.save();

    // Update complaint with feedback reference
    complaint.citizenRating = overallSatisfaction;
    complaint.citizenFeedback = comment;
    await complaint.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/feedback/:complaintId
 * Get feedback for a specific complaint
 */
router.get('/feedback/:complaintId', authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;

    const feedback = await ComplaintFeedback.findOne({
      complaint: complaintId
    }).populate('citizen', 'name email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'No feedback found for this complaint'
      });
    }

    // Check permissions
    const complaint = await Complaint.findById(complaintId);
    const isOwner = complaint.citizen.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignedStaff = complaint.assignedToFieldStaff?.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isAssignedStaff) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this feedback'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/my-performance
 * Get performance metrics for logged-in field staff
 */
router.get('/my-performance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'field_staff') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only for field staff'
      });
    }

    const { timeRange = 30 } = req.query;

    const performance = await analyticsService.getFieldStaffPerformance(
      req.user._id,
      {
        timeRange: parseInt(timeRange),
        includeDetails: true
      }
    );

    res.json({
      success: true,
      data: performance.performanceData[0] || null
    });
  } catch (error) {
    console.error('Error fetching my performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      error: error.message
    });
  }
});

module.exports = router;
