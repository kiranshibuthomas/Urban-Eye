const express = require('express');
const FieldWorkService = require('../services/fieldWorkService');
const WorkLog = require('../models/WorkLog');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// @route   GET /api/admin/field-work/pending-reviews
// @desc    Get work logs pending admin review
// @access  Private (Admin only)
router.get('/pending-reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { reviewStatus: 'pending' };
    
    // Add filters
    if (req.query.fieldStaff) {
      filter.fieldStaff = req.query.fieldStaff;
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.submittedAt = {};
      if (req.query.startDate) filter.submittedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.submittedAt.$lte = new Date(req.query.endDate);
    }

    const total = await WorkLog.countDocuments(filter);
    
    const workLogs = await WorkLog.find(filter)
      .populate('complaint', 'title description category priority address')
      .populate('fieldStaff', 'name email department')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      workLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending reviews'
    });
  }
});

// @route   GET /api/admin/field-work/work-log/:id
// @desc    Get detailed work log for review
// @access  Private (Admin only)
router.get('/work-log/:id', async (req, res) => {
  try {
    const workLogId = req.params.id;
    const workLog = await FieldWorkService.getWorkLogForReview(workLogId);

    res.json({
      success: true,
      workLog
    });

  } catch (error) {
    console.error('Get work log error:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/field-work/review/:id
// @desc    Review and approve/reject field work
// @access  Private (Admin only)
router.post('/review/:id', async (req, res) => {
  try {
    const workLogId = req.params.id;
    const adminId = req.user._id;
    const { reviewStatus, reviewNotes, qualityScore } = req.body;

    if (!reviewStatus || !['approved', 'rejected', 'needs_revision'].includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid review status is required (approved, rejected, needs_revision)'
      });
    }

    if (reviewStatus === 'rejected' && !reviewNotes) {
      return res.status(400).json({
        success: false,
        message: 'Review notes are required for rejection'
      });
    }

    if (qualityScore && (qualityScore < 1 || qualityScore > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Quality score must be between 1 and 5'
      });
    }

    const result = await FieldWorkService.reviewWork(
      workLogId,
      adminId,
      reviewStatus,
      reviewNotes,
      qualityScore
    );

    res.json(result);

  } catch (error) {
    console.error('Review work error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/field-work/statistics
// @desc    Get field work statistics for admin dashboard
// @access  Private (Admin only)
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate, fieldStaff } = req.query;
    
    // Build match query
    const matchQuery = {};
    
    if (fieldStaff) {
      matchQuery.fieldStaff = mongoose.Types.ObjectId(fieldStaff);
    }
    
    if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) matchQuery.startTime.$gte = new Date(startDate);
      if (endDate) matchQuery.startTime.$lte = new Date(endDate);
    }

    const stats = await WorkLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'submitted']] }, 1, 0] }
          },
          pendingReviews: {
            $sum: { $cond: [{ $eq: ['$reviewStatus', 'pending'] }, 1, 0] }
          },
          approvedWork: {
            $sum: { $cond: [{ $eq: ['$reviewStatus', 'approved'] }, 1, 0] }
          },
          rejectedWork: {
            $sum: { $cond: [{ $eq: ['$reviewStatus', 'rejected'] }, 1, 0] }
          },
          totalWorkTime: { $sum: '$totalDuration' },
          averageWorkTime: { $avg: '$totalDuration' },
          averageQualityScore: { $avg: '$qualityScore' },
          totalProgressUpdates: { $sum: { $size: '$progressUpdates' } }
        }
      }
    ]);

    // Get field staff performance
    const fieldStaffStats = await WorkLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$fieldStaff',
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'submitted']] }, 1, 0] }
          },
          averageQualityScore: { $avg: '$qualityScore' },
          totalWorkTime: { $sum: '$totalDuration' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'fieldStaff'
        }
      },
      {
        $unwind: '$fieldStaff'
      },
      {
        $project: {
          name: '$fieldStaff.name',
          email: '$fieldStaff.email',
          department: '$fieldStaff.department',
          totalSessions: 1,
          completedSessions: 1,
          averageQualityScore: { $round: ['$averageQualityScore', 2] },
          totalWorkHours: { $round: [{ $divide: ['$totalWorkTime', 3600000] }, 2] }
        }
      },
      { $sort: { completedSessions: -1 } }
    ]);

    res.json({
      success: true,
      statistics: stats[0] || {
        totalSessions: 0,
        completedSessions: 0,
        pendingReviews: 0,
        approvedWork: 0,
        rejectedWork: 0,
        totalWorkTime: 0,
        averageWorkTime: 0,
        averageQualityScore: 0,
        totalProgressUpdates: 0
      },
      fieldStaffPerformance: fieldStaffStats
    });

  } catch (error) {
    console.error('Get admin statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// @route   GET /api/admin/field-work/all-work-logs
// @desc    Get all work logs with filters
// @access  Private (Admin only)
router.get('/all-work-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Add filters
    if (req.query.fieldStaff) {
      filter.fieldStaff = req.query.fieldStaff;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.reviewStatus) {
      filter.reviewStatus = req.query.reviewStatus;
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.startTime = {};
      if (req.query.startDate) filter.startTime.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.startTime.$lte = new Date(req.query.endDate);
    }

    const total = await WorkLog.countDocuments(filter);
    
    const workLogs = await WorkLog.find(filter)
      .populate('complaint', 'title description category priority address')
      .populate('fieldStaff', 'name email department')
      .populate('reviewedBy', 'name email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      workLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all work logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work logs'
    });
  }
});

// @route   GET /api/admin/field-work/field-staff-performance/:id
// @desc    Get detailed performance data for a specific field staff
// @access  Private (Admin only)
router.get('/field-staff-performance/:id', async (req, res) => {
  try {
    const fieldStaffId = req.params.id;
    const { startDate, endDate } = req.query;

    // Get work statistics
    const stats = await FieldWorkService.getWorkStatistics(fieldStaffId, startDate, endDate);
    
    // Get recent work logs
    const recentWork = await WorkLog.find({
      fieldStaff: fieldStaffId,
      ...(startDate || endDate ? {
        startTime: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      } : {})
    })
    .populate('complaint', 'title category priority')
    .sort({ startTime: -1 })
    .limit(10);

    // Get quality scores over time
    const qualityTrend = await WorkLog.aggregate([
      {
        $match: {
          fieldStaff: mongoose.Types.ObjectId(fieldStaffId),
          qualityScore: { $exists: true },
          ...(startDate || endDate ? {
            startTime: {
              ...(startDate && { $gte: new Date(startDate) }),
              ...(endDate && { $lte: new Date(endDate) })
            }
          } : {})
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' }
          },
          averageQuality: { $avg: '$qualityScore' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      performance: {
        statistics: stats,
        recentWork,
        qualityTrend
      }
    });

  } catch (error) {
    console.error('Get field staff performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching performance data'
    });
  }
});

module.exports = router;