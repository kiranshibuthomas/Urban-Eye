const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  sendComplaintSubmittedEmail,
  sendComplaintInProgressEmail,
  sendComplaintAssignedToFieldStaffEmail,
  sendComplaintResolvedEmail,
  sendComplaintRejectedEmail,
  sendComplaintClosedEmail,
  sendWorkApprovedEmail
} = require('../services/emailService');
const { isWithinKottayam } = require('../utils/geofencing');
const { categorizeComplaint } = require('../services/aiCategorizationService');
const { autoAssignComplaint } = require('../services/autoAssignmentService');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/complaints');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 images per complaint
  }
});

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private (Citizens only)
router.post('/', authenticateToken, requireRole('citizen'), upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      address,
      city,
      pincode,
      latitude,
      longitude,
      isAnonymous
    } = req.body;

    // Trim and validate required fields
    const trimmedTitle = title?.toString().trim();
    const trimmedDescription = description?.toString().trim();
    const trimmedAddress = address?.toString().trim();
    const trimmedCity = city?.toString().trim();
    
    if (!trimmedTitle || !trimmedDescription || !trimmedAddress || !trimmedCity || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, address, city, and location'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Validate location is within Kanjirapally panchayath (Geofencing)
    const geofenceCheck = isWithinKottayam(lat, lng); // Using backward compatible function name
    if (!geofenceCheck.isInside) {
      // Geofence violation detected
      return res.status(403).json({
        success: false,
        message: geofenceCheck.message,
        error: 'LOCATION_OUTSIDE_SERVICE_AREA'
      });
    }

    // Get user information
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Process uploaded images
    const images = [];
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          url: `/uploads/complaints/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size
        });
        imagePaths.push(file.path);
      }
    }

    // AI-powered categorization
    console.log('🤖 Starting AI categorization...');
    const aiAnalysis = await categorizeComplaint(trimmedTitle, trimmedDescription, imagePaths);
    console.log('🎯 AI Analysis Result:', aiAnalysis);

    // Create complaint with AI-determined category and priority
    const complaint = new Complaint({
      title: trimmedTitle,
      description: trimmedDescription,
      category: aiAnalysis.category,
      priority: aiAnalysis.priority,
      citizen: user._id,
      citizenName: isAnonymous === 'true' ? 'Anonymous' : user.name,
      citizenEmail: user.email,
      citizenPhone: user.phone,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      address: trimmedAddress,
      city: trimmedCity,
      pincode: pincode ? pincode.toString().trim() : undefined,
      images,
      isAnonymous: isAnonymous === 'true',
      // Store AI analysis for reference
      aiAnalysis: {
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.analysis.reasoning,
        analyzedAt: new Date()
      }
    });

    await complaint.save();

    // Populate citizen information for response
    await complaint.populate('citizen', 'name email phone preferences');

    // Auto-assign to field staff
    let assignmentResult = null;
    try {
      console.log('🚀 Starting auto-assignment to field staff...');
      assignmentResult = await autoAssignComplaint(complaint._id);
      console.log('✅ Auto-assignment successful:', assignmentResult.message);
      
      // Reload complaint with field staff info
      await complaint.populate('assignedToFieldStaff', 'name email department jobRole');
      
      // Send assignment email to citizen
      if (complaint.assignedToFieldStaff) {
        await sendComplaintAssignedToFieldStaffEmail(
          complaint, 
          user, 
          complaint.assignedToFieldStaff.name, 
          complaint.assignedToFieldStaff.department
        );
      }
      
    } catch (assignmentError) {
      console.error('Auto-assignment failed:', assignmentError);
      // Don't fail the request if auto-assignment fails
      // Complaint will remain in pending status for manual assignment
    }

    // Send email notification to user
    try {
      await sendComplaintSubmittedEmail(complaint, user);
      // Complaint submission email sent
    } catch (emailError) {
      console.error('Failed to send complaint submission email:', emailError);
      // Don't fail the request if email fails
    }

    const responseMessage = assignmentResult 
      ? `Complaint submitted and automatically assigned to ${assignmentResult.fieldStaff.name} (${assignmentResult.fieldStaff.department})`
      : 'Complaint submitted successfully. AI categorized as ' + aiAnalysis.category + ' with ' + aiAnalysis.priority + ' priority.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      complaint: complaint,
      aiAnalysis: {
        category: aiAnalysis.category,
        priority: aiAnalysis.priority,
        confidence: aiAnalysis.confidence
      },
      assignment: assignmentResult ? {
        fieldStaff: assignmentResult.fieldStaff.name,
        department: assignmentResult.fieldStaff.department,
        status: 'assigned'
      } : null
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    
    // Clean up uploaded files if complaint creation fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during complaint creation'
    });
  }
});

// @route   GET /api/complaints/user
// @desc    Get user's own complaints
// @access  Private (Citizens only)
router.get('/user', authenticateToken, requireRole('citizen'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      category,
      priority,
      search,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object - only user's complaints (include deleted ones)
    const filter = {
      citizen: req.user._id
    };

    // If status is specified and not 'deleted', exclude deleted complaints
    if (status && status !== 'deleted') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ]
      });
    }
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('assignedToFieldStaff', 'name email department jobRole experience')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      complaints,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user complaints'
    });
  }
});

// @route   GET /api/complaints/stats
// @desc    Get user's complaint statistics
// @access  Private (Citizens only)
router.get('/stats', authenticateToken, requireRole('citizen'), async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Complaint.aggregate([
      { $match: { citizen: userId } },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalComplaints: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// @route   GET /api/complaints/recent
// @desc    Get recent complaints for user
// @access  Private (Citizens only)
router.get('/recent', authenticateToken, requireRole('citizen'), async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user._id;

    const complaints = await Complaint.find({ citizen: userId })
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .populate('citizen', 'name email')
      .select('title status priority submittedAt category');

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get recent complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent complaints'
    });
  }
});

// @route   GET /api/complaints/stats/overview
// @desc    Get admin overview statistics
// @access  Private (Admin only)
router.get('/stats/overview', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Get active complaints stats
    const stats = await Complaint.aggregate([
      {
        $match: {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    // Get deleted complaints count
    const deletedStats = await Complaint.aggregate([
      {
        $match: {
          isDeleted: true
        }
      },
      {
        $group: {
          _id: null,
          deleted: { $sum: 1 }
        }
      }
    ]);

    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeStaff: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
        }
      }
    ]);

    const result = {
      total: stats[0]?.totalComplaints || 0,
      pending: stats[0]?.pending || 0,
      inProgress: stats[0]?.inProgress || 0,
      resolved: stats[0]?.resolved || 0,
      rejected: stats[0]?.rejected || 0,
      deleted: deletedStats[0]?.deleted || 0,
      totalUsers: userStats[0]?.totalUsers || 0,
      activeStaff: userStats[0]?.activeStaff || 0,
      avgResolutionTime: '2.5 days',
      satisfactionRate: '85%'
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview statistics'
    });
  }
});

// @route   GET /api/complaints
// @desc    Get complaints with filtering and pagination
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      assignedTo,
      search,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'citizen') {
      filter.citizen = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    // Exclude deleted complaints by default (unless specifically requested)
    if (status !== 'deleted') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ]
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('assignedToFieldStaff', 'name email department jobRole experience')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      complaints,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
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

// @route   GET /api/complaints/audit-logs
// @desc    Get audit logs for complaints (Admin only)
// @access  Private (Admin only)
router.get('/audit-logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityId } = req.query;
    
    const filter = { entityType: 'complaint' };
    if (action) filter.action = action;
    if (entityId) filter.entityId = entityId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching audit logs'
    });
  }
});

// @route   DELETE /api/complaints/audit-logs/:logId
// @desc    Delete an audit log (Admin only)
// @access  Private (Admin only)
router.delete('/audit-logs/:logId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.logId);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    await AuditLog.findByIdAndDelete(req.params.logId);

    res.json({
      success: true,
      message: 'Audit log deleted successfully'
    });

  } catch (error) {
    console.error('Delete audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting audit log'
    });
  }
});

// @route   DELETE /api/complaints/audit-logs
// @desc    Clear all audit logs (Admin only)
// @access  Private (Admin only)
router.delete('/audit-logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await AuditLog.deleteMany({ entityType: 'complaint' });

    res.json({
      success: true,
      message: 'All audit logs cleared successfully'
    });

  } catch (error) {
    console.error('Clear audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing audit logs'
    });
  }
});

// @route   GET /api/complaints/heatmap-data
// @desc    Get complaint location data for heatmap visualization (Admin only)
// @access  Private (Admin only)
router.get('/heatmap-data', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { 
      category, 
      status, 
      priority, 
      startDate, 
      endDate,
      includeDeleted = false 
    } = req.query;

    // Build filter object
    const filter = {};

    // Exclude deleted complaints by default
    if (!includeDeleted || includeDeleted === 'false') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ]
      });
    }

    // Apply filters
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Date range filter
    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) {
        filter.submittedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.submittedAt.$lte = new Date(endDate);
      }
    }

    // Get complaint locations with basic info
    const complaints = await Complaint.find(filter)
      .select('location coordinates category status priority submittedAt address city')
      .lean();

    // Transform data for heatmap
    const heatmapData = complaints
      .filter(complaint => complaint.location && complaint.location.coordinates)
      .map(complaint => ({
        lat: complaint.location.coordinates[1], // latitude
        lng: complaint.location.coordinates[0], // longitude
        intensity: getIntensityByPriority(complaint.priority),
        category: complaint.category,
        status: complaint.status,
        priority: complaint.priority,
        submittedAt: complaint.submittedAt,
        address: complaint.address,
        city: complaint.city
      }));

    // Get statistics for the filtered data
    const stats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          byCategory: {
            $push: {
              category: '$category',
              priority: '$priority',
              status: '$status'
            }
          }
        }
      }
    ]);

    // Process category statistics
    const categoryStats = {};
    const priorityStats = {};
    const statusStats = {};

    if (stats.length > 0 && stats[0].byCategory) {
      stats[0].byCategory.forEach(item => {
        // Category stats
        categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
        
        // Priority stats
        priorityStats[item.priority] = (priorityStats[item.priority] || 0) + 1;
        
        // Status stats
        statusStats[item.status] = (statusStats[item.status] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        heatmapData,
        statistics: {
          totalComplaints: stats[0]?.totalComplaints || 0,
          categoryStats,
          priorityStats,
          statusStats
        },
        filters: {
          category,
          status,
          priority,
          startDate,
          endDate,
          includeDeleted
        }
      }
    });

  } catch (error) {
    console.error('Get heatmap data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching heatmap data'
    });
  }
});

// Helper function to determine heatmap intensity based on priority
function getIntensityByPriority(priority) {
  const intensityMap = {
    'urgent': 1.0,
    'high': 0.8,
    'medium': 0.6,
    'low': 0.4
  };
  return intensityMap[priority] || 0.5;
}

// @route   GET /api/complaints/:id
// @desc    Get a specific complaint
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('assignedToFieldStaff', 'name email department jobRole experience')
      .populate('adminNotes.addedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count
    complaint.viewCount += 1;
    await complaint.save();

    res.json({
      success: true,
      complaint
    });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaint'
    });
  }
});

// @route   GET /api/complaints/:id/audit-trail
// @desc    Get audit trail for a specific complaint (Admin only)
// @access  Private (Admin only)
router.get('/:id/audit-trail', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.getAuditTrail('complaint', req.params.id);
    
    res.json({
      success: true,
      auditTrail: logs
    });

  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching audit trail'
    });
  }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, resolutionNotes, rejectionReason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Only allow specific workflow transitions for admin
    const allowedTransitions = {
      'pending': ['rejected', 'closed'],
      'work_completed': ['resolved'] // This should be handled by approve-work route instead
    };

    if (!allowedTransitions[complaint.status] || !allowedTransitions[complaint.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${complaint.status} to ${status}. Use proper workflow routes.`
      });
    }

    // Store previous status for email notification
    const previousStatus = complaint.status;

    // Update status
    complaint.status = status;
    complaint.lastUpdated = new Date();

    // Handle resolution
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      if (resolutionNotes) {
        complaint.resolutionNotes = resolutionNotes;
      }
    }

    // Handle rejection
    if (status === 'rejected') {
      complaint.rejectedAt = new Date();
      complaint.rejectedBy = req.user.id;
      if (rejectionReason) {
        complaint.rejectionReason = rejectionReason;
      }
    }

    await complaint.save();

    // Log the rejection action if applicable
    if (status === 'rejected') {
      try {
        await AuditLog.logAction({
          action: 'reject_work',
          entityType: 'complaint',
          entityId: complaint._id,
          performedBy: req.user._id,
          performedByEmail: req.user.email,
          reason: rejectionReason || 'No reason provided',
          details: {
            complaintTitle: complaint.title,
            complaintCategory: complaint.category,
            complaintPriority: complaint.priority,
            fieldStaffId: complaint.assignedToFieldStaff,
            fieldStaffName: complaint.assignedToFieldStaff?.name,
            citizenId: complaint.citizen,
            citizenName: complaint.citizenName
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Failed to log rejection action:', auditError);
        // Don't fail the request if audit logging fails
      }
    }

    // Populate citizen information for email
    await complaint.populate('citizen', 'name email preferences');

    // Send email notification based on status change
    try {
      const user = complaint.citizen;
      
      if (status === 'in_progress' && previousStatus !== 'in_progress') {
        await sendComplaintInProgressEmail(complaint, user, req.user.name);
        // Complaint in progress email sent
      } else if (status === 'resolved' && previousStatus !== 'resolved') {
        await sendComplaintResolvedEmail(complaint, user, resolutionNotes);
        // Complaint resolved email sent
      } else if (status === 'rejected' && previousStatus !== 'rejected') {
        await sendComplaintRejectedEmail(complaint, user, rejectionReason);
        // Complaint rejected email sent
      } else if (status === 'closed' && previousStatus !== 'closed') {
        await sendComplaintClosedEmail(complaint, user);
        // Complaint closed email sent
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      complaint
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
});

// @route   PUT /api/complaints/:id/assign
// @desc    Assign complaint to admin
// @access  Private (Admin only)
router.put('/:id/assign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Assigned admin is required'
      });
    }

    // Verify admin exists
    const admin = await User.findById(assignedTo);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin user'
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Assign complaint
    await complaint.assignToAdmin(assignedTo);

    // Populate citizen information for email
    await complaint.populate('citizen', 'name email preferences');

    // Send email notification for assignment (which changes status to in_progress)
    try {
      const user = complaint.citizen;
      await sendComplaintInProgressEmail(complaint, user, admin.name);
      // Complaint assignment email sent
    } catch (emailError) {
      console.error('Failed to send assignment email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Complaint assigned successfully',
      complaint
    });

  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning complaint'
    });
  }
});

// @route   PUT /api/complaints/:id/approve-work
// @desc    Approve completed work by admin and mark as resolved
// @access  Private (Admin only)
router.put('/:id/approve-work', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { approvalNotes } = req.body;
    const adminId = req.user._id;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint is in work_completed status
    if (complaint.status !== 'work_completed') {
      return res.status(400).json({
        success: false,
        message: `Can only approve work on completed complaints. Current status: ${complaint.status}`
      });
    }

    // Approve the work and mark as resolved
    await complaint.approveWork(adminId, approvalNotes?.trim() || 'Work approved by admin');

    // Update field staff workload count
    if (complaint.assignedToFieldStaff) {
      await User.findByIdAndUpdate(complaint.assignedToFieldStaff, {
        $inc: { currentAssignments: -1 }
      });
    }

    // Populate citizen and field staff information for email
    await complaint.populate('citizen', 'name email preferences');
    await complaint.populate('assignedToFieldStaff', 'name email department');

    // Send resolution email to citizen
    try {
      const user = complaint.citizen;
      const fieldStaff = complaint.assignedToFieldStaff;
      await sendWorkApprovedEmail(complaint, user, fieldStaff?.name || 'Field Staff', approvalNotes?.trim() || 'Work completed successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    // Log the approval action
    try {
      await AuditLog.logAction({
        action: 'approve_work_final',
        entityType: 'complaint',
        entityId: complaint._id,
        performedBy: adminId,
        performedByEmail: req.user.email,
        details: {
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          complaintPriority: complaint.priority,
          fieldStaffId: complaint.assignedToFieldStaff,
          fieldStaffName: complaint.assignedToFieldStaff?.name,
          approvalNotes: approvalNotes?.trim() || 'Work approved',
          citizenId: complaint.citizen,
          citizenName: complaint.citizenName,
          finalStatus: 'resolved'
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Failed to log approval action:', auditError);
      // Don't fail the request if audit logging fails
    }

    res.json({
      success: true,
      message: 'Work approved and complaint resolved successfully',
      complaint,
      status: 'resolved'
    });

  } catch (error) {
    console.error('Approve work error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving work'
    });
  }
});

// @route   PUT /api/complaints/:id/reject-work
// @desc    Reject completed work by admin
// @access  Private (Admin only)
router.put('/:id/reject-work', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { rejectionReason } = req.body;
    const adminId = req.user._id;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint is in work_completed status
    if (complaint.status !== 'work_completed') {
      return res.status(400).json({
        success: false,
        message: `Can only reject work on completed complaints. Current status: ${complaint.status}`
      });
    }

    // Reject the work and reassign to field staff
    complaint.status = 'in_progress';
    complaint.workRejectedAt = new Date();
    complaint.workRejectionReason = rejectionReason.trim();
    complaint.lastUpdated = new Date();

    // Add admin note about rejection
    complaint.addAdminNote(`Work rejected: ${rejectionReason.trim()}`, adminId);

    await complaint.save();

    // Populate field staff information for email
    await complaint.populate('assignedToFieldStaff', 'name email');

    // Send rejection email to field staff
    try {
      const fieldStaff = complaint.assignedToFieldStaff;
      await sendWorkRejectedEmail(complaint, fieldStaff, rejectionReason.trim());
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Work rejected successfully',
      complaint
    });

  } catch (error) {
    console.error('Reject work error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting work'
    });
  }
});

// @route   PUT /api/complaints/:id/assign-field-staff
// @desc    Assign complaint to field staff
// @access  Private (Admin only)
router.put('/:id/assign-field-staff', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { assignedToFieldStaff } = req.body;

    if (!assignedToFieldStaff) {
      return res.status(400).json({
        success: false,
        message: 'Assigned field staff is required'
      });
    }

    // Verify field staff exists and is active
    const fieldStaff = await User.findById(assignedToFieldStaff);
    if (!fieldStaff || fieldStaff.role !== 'field_staff' || !fieldStaff.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field staff user or user is inactive'
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint category matches field staff department
    const categoryToDepartmentMap = {
      'waste_management': 'sanitation',
      'water_supply': 'water_supply',
      'electricity': 'electricity',
      'street_lighting': 'electricity',
      'road_issues': 'public_works',
      'drainage': 'public_works',
      'parks_recreation': 'public_works'
    };

    const expectedDepartment = categoryToDepartmentMap[complaint.category];
    if (expectedDepartment && fieldStaff.department !== expectedDepartment) {
      return res.status(400).json({
        success: false,
        message: `This complaint category (${complaint.category}) should be assigned to ${expectedDepartment} department, not ${fieldStaff.department}`
      });
    }

    // Assign complaint to field staff
    await complaint.assignToFieldStaff(assignedToFieldStaff, req.user._id);

    // Populate citizen information for email
    await complaint.populate('citizen', 'name email preferences');

    // Send email notification for assignment
    try {
      const user = complaint.citizen;
      await sendComplaintAssignedToFieldStaffEmail(complaint, user, fieldStaff.name, fieldStaff.department);
      // Field staff assignment email sent
    } catch (emailError) {
      console.error('Failed to send field staff assignment email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Complaint assigned to field staff successfully',
      complaint
    });

  } catch (error) {
    console.error('Assign field staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning complaint to field staff'
    });
  }
});

// @route   PUT /api/complaints/:id/approve-work
// @desc    Approve completed work by field staff
// @access  Private (Admin only)
router.put('/:id/approve-work', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { approvalNotes } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint is in work_completed status
    if (complaint.status !== 'work_completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve complaints that have completed work'
      });
    }

    // Approve the work
    await complaint.approveWork(req.user._id, approvalNotes || '');

    // Populate citizen and field staff information for email
    await complaint.populate('citizen', 'name email preferences');
    await complaint.populate('assignedToFieldStaff', 'name email department');

    // Send email notification for approval
    try {
      const user = complaint.citizen;
      const admin = await User.findById(req.user._id);
      await sendWorkApprovedEmail(complaint, user, admin.name, approvalNotes || '');
      // Work approval email sent
    } catch (emailError) {
      console.error('Failed to send work approval email:', emailError);
      // Don't fail the request if email fails
    }

    // Log the approval action
    try {
      await AuditLog.logAction({
        action: 'approve_work',
        entityType: 'complaint',
        entityId: complaint._id,
        performedBy: req.user._id,
        performedByEmail: req.user.email,
        details: {
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          complaintPriority: complaint.priority,
          fieldStaffId: complaint.assignedToFieldStaff,
          fieldStaffName: complaint.assignedToFieldStaff?.name,
          approvalNotes: approvalNotes || '',
          citizenId: complaint.citizen,
          citizenName: complaint.citizenName
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Failed to log approval action:', auditError);
      // Don't fail the request if audit logging fails
    }

    res.json({
      success: true,
      message: 'Work approved successfully',
      complaint
    });

  } catch (error) {
    console.error('Approve work error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving work'
    });
  }
});

// @route   POST /api/complaints/:id/notes
// @desc    Add admin note to complaint
// @access  Private (Admin only)
router.post('/:id/notes', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note is required'
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Add note
    await complaint.addAdminNote(note.trim(), req.user._id);

    res.json({
      success: true,
      message: 'Note added successfully',
      complaint
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding note'
    });
  }
});


// @route   GET /api/complaints/nearby
// @desc    Get complaints near a location
// @access  Private
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates or radius'
      });
    }

    const complaints = await Complaint.getComplaintsByLocation(lng, lat, radiusKm);

    res.json({
      success: true,
      complaints,
      location: { latitude: lat, longitude: lng },
      radius: radiusKm
    });

  } catch (error) {
    console.error('Get nearby complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching nearby complaints'
    });
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Soft delete a complaint (Admin only)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (complaint.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Complaint is already deleted'
      });
    }

    // Log the archive action before soft delete
    await AuditLog.logAction({
      action: 'archive',
      entityType: 'complaint',
      entityId: complaint._id,
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      reason: reason || 'No reason provided',
      details: {
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        complaintPriority: complaint.priority,
        complaintStatus: complaint.status,
        citizenId: complaint.citizen,
        citizenName: complaint.citizenName
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Soft delete the complaint
    await complaint.softDelete(req.user._id, reason || 'Deleted by admin');

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });

  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting complaint'
    });
  }
});

// @route   POST /api/complaints/:id/restore
// @desc    Restore a soft-deleted complaint (Admin only)
// @access  Private (Admin only)
router.post('/:id/restore', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!complaint.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Complaint is not deleted'
      });
    }

    // Restore the complaint
    await complaint.restore();

    res.json({
      success: true,
      message: 'Complaint restored successfully'
    });

  } catch (error) {
    console.error('Restore complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restoring complaint'
    });
  }
});

// @route   DELETE /api/complaints/:id/hard-delete
// @desc    Permanently delete a complaint (Admin only)
// @access  Private (Admin only)
router.delete('/:id/hard-delete', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Delete associated images
    if (complaint.images && complaint.images.length > 0) {
      for (const image of complaint.images) {
        try {
          const imagePath = path.join(__dirname, '../uploads/complaints', image.filename);
          await fs.unlink(imagePath);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    }

    // Delete resolution images
    if (complaint.resolutionImages && complaint.resolutionImages.length > 0) {
      for (const image of complaint.resolutionImages) {
        try {
          const imagePath = path.join(__dirname, '../uploads/complaints', image.filename);
          await fs.unlink(imagePath);
        } catch (error) {
          console.error('Error deleting resolution image:', error);
        }
      }
    }

    // Log the hard delete action before deletion
    await AuditLog.logAction({
      action: 'hard_delete',
      entityType: 'complaint',
      entityId: complaint._id,
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      reason: reason || 'No reason provided',
      details: {
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        complaintPriority: complaint.priority,
        complaintStatus: complaint.status,
        citizenId: complaint.citizen,
        citizenName: complaint.citizenName
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Permanently delete the complaint
    await Complaint.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Complaint permanently deleted'
    });

  } catch (error) {
    console.error('Hard delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while permanently deleting complaint'
    });
  }
});



module.exports = router;


// @route   GET /api/complaints/ai-stats
// @desc    Get AI categorization statistics (Admin only)
// @access  Private (Admin only)
router.get('/ai-stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.submittedAt = {};
      if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
    }

    // Get AI categorization statistics
    const aiStats = await Complaint.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          aiCategorized: { 
            $sum: { 
              $cond: [{ $exists: ['$aiAnalysis.confidence'] }, 1, 0] 
            } 
          },
          avgConfidence: { 
            $avg: '$aiAnalysis.confidence' 
          },
          categoryBreakdown: {
            $push: {
              category: '$category',
              priority: '$priority',
              confidence: '$aiAnalysis.confidence',
              status: '$status'
            }
          }
        }
      }
    ]);

    // Process category statistics
    const categoryStats = {};
    const priorityStats = {};
    const statusStats = {};
    const confidenceRanges = {
      high: 0,    // > 0.8
      medium: 0,  // 0.5 - 0.8
      low: 0      // < 0.5
    };

    if (aiStats.length > 0 && aiStats[0].categoryBreakdown) {
      aiStats[0].categoryBreakdown.forEach(item => {
        // Category stats
        categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
        
        // Priority stats
        priorityStats[item.priority] = (priorityStats[item.priority] || 0) + 1;
        
        // Status stats
        statusStats[item.status] = (statusStats[item.status] || 0) + 1;
        
        // Confidence ranges
        if (item.confidence) {
          if (item.confidence > 0.8) confidenceRanges.high++;
          else if (item.confidence >= 0.5) confidenceRanges.medium++;
          else confidenceRanges.low++;
        }
      });
    }

    // Get auto-assignment success rate
    const assignmentStats = await Complaint.aggregate([
      { $match: { ...dateFilter, assignedToFieldStaff: { $exists: true } } },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          autoAssigned: {
            $sum: {
              $cond: [
                { $eq: ['$fieldStaffAssignedBy', null] }, // System assignment
                1, 
                0
              ]
            }
          }
        }
      }
    ]);

    const result = {
      totalComplaints: aiStats[0]?.totalComplaints || 0,
      aiCategorized: aiStats[0]?.aiCategorized || 0,
      avgConfidence: aiStats[0]?.avgConfidence || 0,
      autoAssignmentRate: assignmentStats[0] ? 
        (assignmentStats[0].autoAssigned / assignmentStats[0].totalAssigned * 100) : 0,
      categoryStats,
      priorityStats,
      statusStats,
      confidenceRanges,
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    };

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Get AI stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching AI statistics'
    });
  }
});

// @route   GET /api/complaints/field-staff-workload
// @desc    Get field staff workload statistics (Admin only)
// @access  Private (Admin only)
router.get('/field-staff-workload', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { department } = req.query;
    const { getFieldStaffWorkload } = require('../services/autoAssignmentService');
    
    const workloadStats = await getFieldStaffWorkload(department);
    
    res.json({
      success: true,
      workloadStats
    });

  } catch (error) {
    console.error('Get workload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching workload statistics'
    });
  }
});

// @route   POST /api/complaints/balance-workload
// @desc    Balance workload across field staff (Admin only)
// @access  Private (Admin only)
router.post('/balance-workload', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { department } = req.body;
    const { balanceWorkload } = require('../services/autoAssignmentService');
    
    const result = await balanceWorkload(department);
    
    res.json({
      success: true,
      message: result.message,
      rebalanceActions: result.rebalanceActions
    });

  } catch (error) {
    console.error('Balance workload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while balancing workload'
    });
  }
});
// @route   POST /api/complaints/:id/auto-assign
// @desc    Manually trigger auto-assignment for testing (Admin only)
// @access  Private (Admin only)
router.post('/:id/auto-assign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const complaintId = req.params.id;
    
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if already assigned
    if (complaint.assignedToFieldStaff) {
      return res.status(400).json({
        success: false,
        message: 'Complaint is already assigned to field staff'
      });
    }

    // Trigger auto-assignment
    const assignmentResult = await autoAssignComplaint(complaintId, req.user._id);
    
    // Reload complaint with field staff info
    await complaint.populate('assignedToFieldStaff', 'name email department jobRole');
    
    // Send assignment email to citizen
    if (complaint.assignedToFieldStaff) {
      await complaint.populate('citizen', 'name email preferences');
      await sendComplaintAssignedToFieldStaffEmail(
        complaint, 
        complaint.citizen, 
        complaint.assignedToFieldStaff.name, 
        complaint.assignedToFieldStaff.department
      );
    }

    res.json({
      success: true,
      message: assignmentResult.message,
      assignment: {
        fieldStaff: assignmentResult.fieldStaff.name,
        department: assignmentResult.fieldStaff.department,
        status: 'assigned'
      }
    });

  } catch (error) {
    console.error('Manual auto-assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during auto-assignment'
    });
  }
});