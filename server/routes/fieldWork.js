const express = require('express');
const FieldWorkService = require('../services/fieldWorkService');
const Complaint = require('../models/Complaint');
const WorkLog = require('../models/WorkLog');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { complaintUpload } = require('../services/cloudinaryService');

const router = express.Router();

// Apply authentication and field staff role check to all routes
router.use(authenticateToken);
router.use(authorizeRoles('field_staff'));

// @route   GET /api/field-work/dashboard
// @desc    Get field staff dashboard data
// @access  Private (Field Staff only)
router.get('/dashboard', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;

    // Get assigned complaints
    const assignedComplaints = await Complaint.find({
      assignedToFieldStaff: fieldStaffId,
      status: { $in: ['assigned', 'in_progress'] },
      isDeleted: false
    })
    .populate('citizen', 'name email phone')
    .sort({ fieldStaffAssignedAt: -1 })
    .limit(10);

    // Get active work session
    const activeSession = await FieldWorkService.getActiveSession(fieldStaffId);

    // Get work statistics for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const stats = await FieldWorkService.getWorkStatistics(fieldStaffId, startOfMonth);

    // Get recent completed work
    const recentWork = await WorkLog.find({
      fieldStaff: fieldStaffId,
      status: { $in: ['completed', 'submitted'] }
    })
    .populate('complaint', 'title category')
    .sort({ endTime: -1 })
    .limit(5);

    res.json({
      success: true,
      dashboard: {
        assignedComplaints,
        activeSession,
        stats: {
          totalAssigned: assignedComplaints.length,
          completedThisMonth: stats.completedSessions || 0,
          totalWorkHours: Math.round((stats.totalWorkTime || 0) / (1000 * 60 * 60) * 10) / 10,
          averageWorkTime: Math.round((stats.averageWorkTime || 0) / (1000 * 60) * 10) / 10 // in minutes
        },
        recentWork
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/field-work/complaints
// @desc    Get complaints assigned to field staff
// @access  Private (Field Staff only)
router.get('/complaints', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const total = await Complaint.countDocuments(filter);
    
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .sort({ fieldStaffAssignedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      complaints,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaints'
    });
  }
});

// @route   GET /api/field-work/complaints/:id
// @desc    Get specific complaint details
// @access  Private (Field Staff only)
router.get('/complaints/:id', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    })
    .populate('citizen', 'name email phone address')
    .populate('assignedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    // Get work logs for this complaint
    const workLogs = await WorkLog.find({
      complaint: complaintId,
      fieldStaff: fieldStaffId
    }).sort({ startTime: -1 });

    // Get active session if any
    const activeSession = await WorkLog.findOne({
      complaint: complaintId,
      fieldStaff: fieldStaffId,
      status: { $in: ['started', 'paused', 'resumed', 'completed'] }
    });

    res.json({
      success: true,
      complaint,
      workLogs,
      activeSession
    });

  } catch (error) {
    console.error('Get complaint details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaint details'
    });
  }
});

// @route   POST /api/field-work/start
// @desc    Start work on a complaint
// @access  Private (Field Staff only)
router.post('/start', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { complaintId, location, notes } = req.body;

    if (!complaintId || !location) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID and location are required'
      });
    }

    if (!location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Valid GPS coordinates are required'
      });
    }

    const result = await FieldWorkService.startWork(
      complaintId,
      fieldStaffId,
      location,
      notes
    );

    res.json(result);

  } catch (error) {
    console.error('Start work error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/field-work/progress
// @desc    Add progress update
// @access  Private (Field Staff only)
router.post('/progress', complaintUpload.array('images', 3), async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { sessionId, description, location } = req.body;

    if (!sessionId || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, description, and location are required'
      });
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          url: file.path,
          filename: file.filename || file.public_id,
          originalName: file.originalname
        });
      }
    }

    const locationData = JSON.parse(location);
    const result = await FieldWorkService.addProgressUpdate(
      sessionId,
      fieldStaffId,
      description,
      locationData,
      images
    );

    res.json(result);

  } catch (error) {
    console.error('Progress update error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/field-work/pause
// @desc    Pause current work
// @access  Private (Field Staff only)
router.post('/pause', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { sessionId, reason, location, notes } = req.body;

    if (!sessionId || !reason || !location) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, reason, and location are required'
      });
    }

    const result = await FieldWorkService.pauseWork(
      sessionId,
      fieldStaffId,
      reason,
      location,
      notes
    );

    res.json(result);

  } catch (error) {
    console.error('Pause work error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/field-work/resume
// @desc    Resume paused work
// @access  Private (Field Staff only)
router.post('/resume', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { sessionId, location, notes } = req.body;

    if (!sessionId || !location) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and location are required'
      });
    }

    const result = await FieldWorkService.resumeWork(
      sessionId,
      fieldStaffId,
      location,
      notes
    );

    res.json(result);

  } catch (error) {
    console.error('Resume work error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/field-work/complete
// @desc    Complete work
// @access  Private (Field Staff only)
router.post('/complete', complaintUpload.array('completionImages', 5), async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { sessionId, completionNotes, location } = req.body;

    if (!sessionId || !completionNotes || !location) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, completion notes, and location are required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one completion image is required'
      });
    }

    // Process uploaded images
    const completionImages = [];
    for (const file of req.files) {
      completionImages.push({
        url: file.path,
        filename: file.filename || file.public_id,
        originalName: file.originalname
      });
    }

    const locationData = JSON.parse(location);
    const result = await FieldWorkService.completeWork(
      sessionId,
      fieldStaffId,
      completionNotes,
      completionImages,
      locationData
    );

    res.json(result);

  } catch (error) {
    console.error('Complete work error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/field-work/submit
// @desc    Submit completed work for admin review
// @access  Private (Field Staff only)
router.post('/submit', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const result = await FieldWorkService.submitForReview(sessionId, fieldStaffId);

    res.json(result);

  } catch (error) {
    console.error('Submit work error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/field-work/active-session
// @desc    Get current active work session
// @access  Private (Field Staff only)
router.get('/active-session', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const activeSession = await FieldWorkService.getActiveSession(fieldStaffId);

    res.json({
      success: true,
      activeSession
    });

  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active session'
    });
  }
});

// @route   GET /api/field-work/history
// @desc    Get work history
// @access  Private (Field Staff only)
router.get('/history', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await FieldWorkService.getWorkHistory(fieldStaffId, page, limit);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get work history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work history'
    });
  }
});

// @route   GET /api/field-work/statistics
// @desc    Get work statistics
// @access  Private (Field Staff only)
router.get('/statistics', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { startDate, endDate } = req.query;

    const stats = await FieldWorkService.getWorkStatistics(fieldStaffId, startDate, endDate);

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;