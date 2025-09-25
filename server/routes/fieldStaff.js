const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
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

    // Check if complaint is in assigned status
    if (complaint.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Can only start work on assigned complaints'
      });
    }

    // Update status
    complaint.status = status;
    complaint.lastUpdated = new Date();

    // Add notes if provided
    if (notes && notes.trim()) {
      complaint.addAdminNote(notes.trim(), fieldStaffId);
    }

    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
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

// @route   POST /api/field-staff/complaints/:id/complete-work
// @desc    Mark work as completed and upload proof
// @access  Private (Field Staff only)
router.post('/complaints/:id/complete-work', upload.array('proofImages', 5), async (req, res) => {
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
          url: `/uploads/complaints/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
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
      console.log('Work completion email sent to:', user.email);
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

module.exports = router;
