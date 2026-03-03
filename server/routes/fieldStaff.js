const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { complaintUpload } = require('../services/cloudinaryService');
const { sendWorkCompletedEmail } = require('../services/emailService');

const router = express.Router();

// Apply authentication and field staff role check to all routes
router.use(authenticateToken);
router.use(authorizeRoles('field_staff'));

// @route   GET /api/field-staff/dashboard
// @desc    Get field staff dashboard data
// @access  Private (Field Staff only)
router.get('/dashboard', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const fieldStaff = await User.findById(fieldStaffId);
    
    if (!fieldStaff) {
      return res.status(404).json({
        success: false,
        message: 'Field staff not found'
      });
    }

    // Get assigned complaints for this field staff
    const assignedComplaints = await Complaint.find({
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    })
    .populate('citizen', 'name email')
    .sort({ fieldStaffAssignedAt: -1 });

    // Get statistics for this field staff
    const stats = await Complaint.aggregate([
      {
        $match: {
          assignedToFieldStaff: fieldStaffId,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          workCompleted: { $sum: { $cond: [{ $eq: ['$status', 'work_completed'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      }
    ]);

    // Get recent activity (last 10 complaints)
    const recentActivity = await Complaint.find({
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    })
    .populate('citizen', 'name')
    .sort({ lastUpdated: -1 })
    .limit(10);

    res.json({
      success: true,
      dashboard: {
        fieldStaff: {
          name: fieldStaff.name,
          department: fieldStaff.department,
          email: fieldStaff.email
        },
        stats: stats[0] || {
          totalAssigned: 0,
          assigned: 0,
          inProgress: 0,
          workCompleted: 0,
          resolved: 0
        },
        assignedComplaints: assignedComplaints.slice(0, 5), // Show only recent 5
        recentActivity
      }
    });

  } catch (error) {
    console.error('Field staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/field-staff/complaints
// @desc    Get complaints assigned to field staff
// @access  Private (Field Staff only)
router.get('/complaints', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    };
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Priority filter
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Get total count for pagination
    const total = await Complaint.countDocuments(filter);
    
    // Get complaints with pagination
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedBy', 'name')
      .sort({ fieldStaffAssignedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      complaints,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComplaints: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get field staff complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaints'
    });
  }
});

// @route   GET /api/field-staff/complaints/:id
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
    .populate('assignedBy', 'name')
    .populate('assignedToFieldStaff', 'name department');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    res.json({
      success: true,
      complaint
    });

  } catch (error) {
    console.error('Get complaint details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaint details'
    });
  }
});

// @route   PUT /api/field-staff/complaints/:id/update-status
// @desc    Update complaint status (start work, mark as in progress)
// @access  Private (Field Staff only)
router.put('/complaints/:id/update-status', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { status, notes } = req.body;

    // Validate status transition
    const validStatuses = ['in_progress'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Field staff can only update to in_progress'
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    // Strict status transition validation
    if (complaint.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot start work on complaint with status: ${complaint.status}. Only assigned complaints can be started.`
      });
    }

    // Update status to in_progress
    complaint.status = status;
    complaint.workStartedAt = new Date(); // Track when work actually started
    complaint.lastUpdated = new Date();

    // Add notes if provided
    if (notes && notes.trim()) {
      complaint.adminNotes = complaint.adminNotes || [];
      complaint.adminNotes.push({
        note: `Work started: ${notes.trim()}`,
        addedBy: fieldStaffId,
        addedAt: new Date()
      });
    }

    await complaint.save();

    res.json({
      success: true,
      message: 'Work started successfully. Status updated to in progress.',
      complaint
    });

  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating complaint status'
    });
  }
});

// @route   PUT /api/field-staff/complaints/:id/update-progress
// @desc    Update progress notes for in-progress complaints
// @access  Private (Field Staff only)
router.put('/complaints/:id/update-progress', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Progress notes are required'
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    // Check if complaint is in progress
    if (complaint.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Can only update progress on in-progress complaints. Current status: ${complaint.status}`
      });
    }

    // Add progress notes
    complaint.adminNotes.push({
      note: notes.trim(),
      addedBy: fieldStaffId,
      addedAt: new Date()
    });
    complaint.lastUpdated = new Date();

    await complaint.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      complaint
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating progress'
    });
  }
});

// @route   POST /api/field-staff/complaints/:id/complete-work
// @desc    Mark work as completed and upload proof
// @access  Private (Field Staff only)
router.post('/complaints/:id/complete-work', complaintUpload.array('proofImages', 5), async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { completionNotes } = req.body;

    if (!completionNotes || !completionNotes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Completion notes are required'
      });
    }

    // Validate proof images more thoroughly
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Proof images are mandatory for work completion. Please upload at least one image showing the completed work.'
      });
    }

    // Validate file types and sizes
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    for (const file of req.files) {
      if (!validImageTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type: ${file.originalname}. Only JPEG, PNG, and WebP images are allowed.`
        });
      }
      
      if (file.size > maxFileSize) {
        return res.status(400).json({
          success: false,
          message: `File too large: ${file.originalname}. Maximum size is 10MB.`
        });
      }
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    // Check if complaint is in progress
    if (complaint.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete work on complaints that are in progress'
      });
    }

    // Process uploaded proof images
    const proofImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        proofImages.push({
          url: file.path, // Cloudinary URL
          filename: file.filename || file.public_id,
          originalName: file.originalname,
          publicId: file.public_id, // Store for deletion
          uploadedAt: new Date()
        });
      }
    }

    // Mark work as completed
    await complaint.markWorkCompleted(completionNotes.trim(), proofImages);

    // Populate citizen information for email
    await complaint.populate('citizen', 'name email preferences');

    // Send email notification for work completion
    try {
      const user = complaint.citizen;
      const fieldStaff = await User.findById(fieldStaffId);
      await sendWorkCompletedEmail(complaint, user, fieldStaff.name, completionNotes.trim());
      // Work completion email sent
    } catch (emailError) {
      console.error('Failed to send work completion email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Work completed successfully',
      complaint
    });

  } catch (error) {
    console.error('Complete work error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing work'
    });
  }
});

// @route   GET /api/field-staff/profile
// @desc    Get field staff profile
// @access  Private (Field Staff only)
router.get('/profile', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const fieldStaff = await User.findById(fieldStaffId);

    if (!fieldStaff) {
      return res.status(404).json({
        success: false,
        message: 'Field staff not found'
      });
    }

    res.json({
      success: true,
      user: fieldStaff.getPublicProfile()
    });

  } catch (error) {
    console.error('Get field staff profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   POST /api/field-staff/complaints/:id/escalate
// @desc    Escalate complaint when field staff needs help
// @access  Private (Field Staff only)
router.post('/complaints/:id/escalate', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { reason, description } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason is required'
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    // Can only escalate assigned or in-progress complaints
    if (!['assigned', 'in_progress'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only escalate assigned or in-progress complaints'
      });
    }

    // Add escalation note
    complaint.adminNotes = complaint.adminNotes || [];
    complaint.adminNotes.push({
      note: `ESCALATION: ${reason.trim()}${description ? ` - ${description.trim()}` : ''}`,
      addedBy: fieldStaffId,
      addedAt: new Date(),
      isEscalation: true
    });

    // Mark as escalated
    complaint.isEscalated = true;
    complaint.escalatedAt = new Date();
    complaint.escalatedBy = fieldStaffId;
    complaint.escalationReason = reason.trim();
    complaint.lastUpdated = new Date();

    await complaint.save();

    // Send escalation email to admins
    try {
      const admins = await User.find({ 
        role: 'admin', 
        isActive: true 
      }).select('name email');
      
      const fieldStaff = await User.findById(fieldStaffId);
      const { sendFieldStaffEscalationEmail } = require('../services/emailService');
      
      for (const admin of admins) {
        await sendFieldStaffEscalationEmail(admin, complaint, reason.trim());
      }
    } catch (emailError) {
      console.error('Failed to send escalation emails:', emailError);
    }

    res.json({
      success: true,
      message: 'Complaint escalated successfully. Admin team has been notified.',
      complaint
    });

  } catch (error) {
    console.error('Escalate complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while escalating complaint'
    });
  }
});

// @route   PUT /api/field-staff/availability
// @desc    Update field staff availability status
// @access  Private (Field Staff only)
router.put('/availability', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { isAvailable, reason } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean value'
      });
    }

    const fieldStaff = await User.findById(fieldStaffId);
    
    if (!fieldStaff) {
      return res.status(404).json({
        success: false,
        message: 'Field staff not found'
      });
    }

    fieldStaff.isAvailable = isAvailable;
    fieldStaff.lastLocationUpdate = new Date();
    
    if (reason && reason.trim()) {
      // Log availability change
      console.log(`Field staff ${fieldStaff.name} availability changed to ${isAvailable ? 'available' : 'unavailable'}: ${reason.trim()}`);
    }

    await fieldStaff.save();

    res.json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: fieldStaff.isAvailable
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating availability'
    });
  }
});

// @route   PUT /api/field-staff/location
// @desc    Update field staff current location
// @access  Private (Field Staff only)
router.put('/location', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const fieldStaff = await User.findById(fieldStaffId);
    
    if (!fieldStaff) {
      return res.status(404).json({
        success: false,
        message: 'Field staff not found'
      });
    }

    fieldStaff.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    fieldStaff.lastLocationUpdate = new Date();

    await fieldStaff.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: fieldStaff.currentLocation,
      lastUpdate: fieldStaff.lastLocationUpdate
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating location'
    });
  }
});

// @route   POST /api/field-staff/complaints/:id/check-in
// @desc    Check in at complaint location
// @access  Private (Field Staff only)
router.post('/complaints/:id/check-in', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { latitude, longitude, notes } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Current location (latitude and longitude) is required for check-in'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    // Check if complaint is in correct status for check-in
    if (!['assigned', 'in_progress'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot check in for complaint with status: ${complaint.status}`
      });
    }

    try {
      const location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };

      const { distance, isValidLocation } = complaint.checkInFieldStaff(fieldStaffId, location, notes);
      await complaint.save();

      // Update field staff location
      const fieldStaff = await User.findById(fieldStaffId);
      fieldStaff.currentLocation = location;
      fieldStaff.lastLocationUpdate = new Date();
      await fieldStaff.save();

      res.json({
        success: true,
        message: isValidLocation 
          ? 'Successfully checked in at complaint location' 
          : `Checked in, but you are ${Math.round(distance)}m away from the complaint location (allowed: ${complaint.allowedWorkRadius}m)`,
        checkIn: {
          distance: Math.round(distance),
          isValidLocation,
          allowedRadius: complaint.allowedWorkRadius,
          checkInTime: new Date()
        }
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in'
    });
  }
});

// @route   POST /api/field-staff/complaints/:id/check-out
// @desc    Check out from complaint location
// @access  Private (Field Staff only)
router.post('/complaints/:id/check-out', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { latitude, longitude, notes } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Current location (latitude and longitude) is required for check-out'
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    try {
      const location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };

      await complaint.checkOutFieldStaff(fieldStaffId, location, notes);

      res.json({
        success: true,
        message: 'Successfully checked out from complaint location',
        checkOut: {
          checkOutTime: new Date(),
          notes: notes || ''
        }
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-out'
    });
  }
});

// @route   POST /api/field-staff/complaints/:id/pause-task
// @desc    Pause current task with reason
// @access  Private (Field Staff only)
router.post('/complaints/:id/pause-task', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { reason, latitude, longitude } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for pausing task is required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Current location is required'
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    try {
      const location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };

      await complaint.pauseTask(fieldStaffId, reason.trim(), location);

      res.json({
        success: true,
        message: 'Task paused successfully',
        pause: {
          reason: reason.trim(),
          pausedAt: new Date(),
          status: 'paused'
        }
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

  } catch (error) {
    console.error('Pause task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while pausing task'
    });
  }
});

// @route   POST /api/field-staff/complaints/:id/resume-task
// @desc    Resume paused task
// @access  Private (Field Staff only)
router.post('/complaints/:id/resume-task', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Current location is required'
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    try {
      const location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };

      await complaint.resumeTask(fieldStaffId, location);

      res.json({
        success: true,
        message: 'Task resumed successfully',
        resume: {
          resumedAt: new Date(),
          status: 'in_progress'
        }
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

  } catch (error) {
    console.error('Resume task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resuming task'
    });
  }
});

// @route   GET /api/field-staff/complaints/:id/location-status
// @desc    Get current location and check-in status for complaint
// @access  Private (Field Staff only)
router.get('/complaints/:id/location-status', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const complaintId = req.params.id;

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you'
      });
    }

    const checkInStatus = complaint.getCurrentCheckInStatus(fieldStaffId);
    
    res.json({
      success: true,
      locationStatus: {
        complaintLocation: complaint.location,
        allowedRadius: complaint.allowedWorkRadius,
        currentTaskStatus: complaint.currentTaskStatus,
        ...checkInStatus,
        recentCheckIns: complaint.fieldStaffCheckIns
          .filter(checkIn => checkIn.fieldStaff.toString() === fieldStaffId.toString())
          .slice(-5) // Last 5 check-ins
          .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)),
        recentPauses: complaint.taskPauses
          .slice(-3) // Last 3 pauses
          .sort((a, b) => new Date(b.pausedAt) - new Date(a.pausedAt))
      }
    });

  } catch (error) {
    console.error('Get location status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching location status'
    });
  }
});

// @route   GET /api/field-staff/work-logs
// @desc    Get detailed work logs for field staff
// @access  Private (Field Staff only)
router.get('/work-logs', async (req, res) => {
  try {
    const fieldStaffId = req.user._id;
    const { startDate, endDate, complaintId } = req.query;

    const filter = {
      assignedToFieldStaff: fieldStaffId,
      isDeleted: false
    };

    if (complaintId) {
      filter._id = complaintId;
    }

    if (startDate || endDate) {
      filter.fieldStaffAssignedAt = {};
      if (startDate) filter.fieldStaffAssignedAt.$gte = new Date(startDate);
      if (endDate) filter.fieldStaffAssignedAt.$lte = new Date(endDate);
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email')
      .sort({ fieldStaffAssignedAt: -1 });

    const workLogs = complaints.map(complaint => {
      const checkIns = complaint.fieldStaffCheckIns.filter(
        checkIn => checkIn.fieldStaff.toString() === fieldStaffId.toString()
      );
      
      const totalWorkTime = checkIns.reduce((total, checkIn) => {
        if (checkIn.checkOutTime) {
          return total + (new Date(checkIn.checkOutTime) - new Date(checkIn.checkInTime));
        }
        return total;
      }, 0);

      return {
        complaintId: complaint._id,
        title: complaint.title,
        status: complaint.status,
        currentTaskStatus: complaint.currentTaskStatus,
        assignedAt: complaint.fieldStaffAssignedAt,
        totalCheckIns: checkIns.length,
        totalPauses: complaint.taskPauses.length,
        totalWorkTimeMs: totalWorkTime,
        totalWorkTimeHours: Math.round(totalWorkTime / (1000 * 60 * 60) * 100) / 100,
        checkIns: checkIns.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)),
        pauses: complaint.taskPauses.sort((a, b) => new Date(b.pausedAt) - new Date(a.pausedAt))
      };
    });

    res.json({
      success: true,
      workLogs,
      summary: {
        totalComplaints: workLogs.length,
        totalCheckIns: workLogs.reduce((sum, log) => sum + log.totalCheckIns, 0),
        totalPauses: workLogs.reduce((sum, log) => sum + log.totalPauses, 0),
        totalWorkHours: Math.round(workLogs.reduce((sum, log) => sum + log.totalWorkTimeHours, 0) * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get work logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work logs'
    });
  }
});

module.exports = router;
