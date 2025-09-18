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
  sendComplaintResolvedEmail,
  sendComplaintRejectedEmail,
  sendComplaintClosedEmail
} = require('../services/emailService');

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

    // Validation
    if (!title || !description || !category || !address || !city || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
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
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          url: `/uploads/complaints/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size
        });
      }
    }

    // Create complaint
    const complaint = new Complaint({
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || 'medium',
      citizen: user._id,
      citizenName: isAnonymous === 'true' ? 'Anonymous' : user.name,
      citizenEmail: user.email,
      citizenPhone: user.phone,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      address: address.trim(),
      city: city.trim(),
      pincode: pincode ? pincode.trim() : undefined,
      images,
      isAnonymous: isAnonymous === 'true'
    });

    await complaint.save();

    // Populate citizen information for response
    await complaint.populate('citizen', 'name email phone preferences');

    // Send email notification to user
    try {
      await sendComplaintSubmittedEmail(complaint, user);
      console.log('Complaint submission email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send complaint submission email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: complaint
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

// @route   GET /api/complaints/:id
// @desc    Get a specific complaint
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email')
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
    const { status, resolutionNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
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

    await complaint.save();

    // Populate citizen information for email
    await complaint.populate('citizen', 'name email preferences');

    // Send email notification based on status change
    try {
      const user = complaint.citizen;
      
      if (status === 'in_progress' && previousStatus !== 'in_progress') {
        await sendComplaintInProgressEmail(complaint, user, req.user.name);
        console.log('Complaint in progress email sent to:', user.email);
      } else if (status === 'resolved' && previousStatus !== 'resolved') {
        await sendComplaintResolvedEmail(complaint, user, resolutionNotes);
        console.log('Complaint resolved email sent to:', user.email);
      } else if (status === 'rejected' && previousStatus !== 'rejected') {
        await sendComplaintRejectedEmail(complaint, user, resolutionNotes);
        console.log('Complaint rejected email sent to:', user.email);
      } else if (status === 'closed' && previousStatus !== 'closed') {
        await sendComplaintClosedEmail(complaint, user);
        console.log('Complaint closed email sent to:', user.email);
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
      console.log('Complaint assignment email sent to:', user.email);
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

