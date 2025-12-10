const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sendOTPVerificationEmail } = require('../services/emailService');

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// @route   GET /api/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Role filter
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Status filter
    if (req.query.status) {
      if (req.query.status === 'active') {
        filter.isActive = true;
      } else if (req.query.status === 'inactive') {
        filter.isActive = false;
      }
    }
    
    // Email verification filter
    if (req.query.verified) {
      filter.isEmailVerified = req.query.verified === 'true';
    }
    
    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -otpCode -otpExpires -otpAttempts -passwordResetOTP -passwordResetExpires -passwordResetAttempts -emailVerificationToken -emailVerificationExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform users to include public profile data
    const transformedUsers = users.map(user => user.getPublicProfile());

    res.json({
      success: true,
      users: transformedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/field-staff
// @desc    Get field staff by department
// @access  Private (Admin only)
router.get('/field-staff', async (req, res) => {
  try {
    const { department } = req.query;
    
    // Build filter for field staff
    const filter = { role: 'field_staff', isActive: true };
    
    // Add department filter if specified
    if (department) {
      const validDepartments = ['sanitation', 'water_supply', 'electricity', 'public_works'];
      if (validDepartments.includes(department)) {
        filter.department = department;
      }
    }

    const fieldStaff = await User.find(filter)
      .select('-password -otpCode -otpExpires -otpAttempts -passwordResetOTP -passwordResetExpires -passwordResetAttempts -emailVerificationToken -emailVerificationExpires')
      .sort({ name: 1 });


    // Transform users to include public profile data
    const transformedFieldStaff = fieldStaff.map(user => user.getPublicProfile());

    res.json({
      success: true,
      fieldStaff: transformedFieldStaff,
      count: transformedFieldStaff.length
    });

  } catch (error) {
    console.error('Get field staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching field staff'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          citizenUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'citizen'] }, 1, 0] }
          },
          fieldStaffUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'field_staff'] }, 1, 0] }
          },
          googleUsers: {
            $sum: { $cond: [{ $ne: ['$googleId', null] }, 1, 0] }
          }
        }
      }
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRegistrations = await User.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const result = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      verifiedUsers: 0,
      adminUsers: 0,
      citizenUsers: 0,
      fieldStaffUsers: 0,
      googleUsers: 0
    };

    res.json({
      success: true,
      stats: {
        ...result,
        recentRegistrations,
        todayRegistrations
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otpCode -otpExpires -otpAttempts -passwordResetOTP -passwordResetExpires -passwordResetAttempts -emailVerificationToken -emailVerificationExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin only)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, department, jobRole, experience, maxWorkload, phone, address, city, zipCode } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Name validation
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot exceed 50 characters'
      });
    }

    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Name can only contain letters and spaces'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Enhanced password strength validation
    const passwordChecks = {
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password)
    };

    const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
    
    if (passwordScore < 3) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 3 of: lowercase, uppercase, number, special character'
      });
    }

    // Phone validation (optional)
    if (phone) {
      const digitsOnly = phone.replace(/[^\d]/g, '');
      if (digitsOnly.length !== 10 || !/^\d{10}$/.test(digitsOnly)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    const validRoles = ['citizen', 'admin', 'field_staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Validate department and job role for field staff
    if (role === 'field_staff') {
      const validDepartments = ['sanitation', 'water_supply', 'electricity', 'public_works'];
      if (!department || !validDepartments.includes(department)) {
        return res.status(400).json({
          success: false,
          message: 'Department is required for field staff and must be one of: sanitation, water_supply, electricity, public_works'
        });
      }

      // Job role is now optional - no validation needed

      // Validate experience
      if (experience === undefined || experience < 0 || experience > 50) {
        return res.status(400).json({
          success: false,
          message: 'Experience must be between 0 and 50 years'
        });
      }

      // Validate max workload
      if (maxWorkload === undefined || maxWorkload < 1 || maxWorkload > 50) {
        return res.status(400).json({
          success: false,
          message: 'Max workload must be between 1 and 50 complaints'
        });
      }
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'citizen',
      department: department || undefined,
      jobRole: jobRole || undefined,
      experience: experience || undefined,
      maxWorkload: maxWorkload || undefined,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      city: city ? city.trim() : undefined,
      zipCode: zipCode ? zipCode.trim() : undefined,
      isEmailVerified: true // Admin-created users are auto-verified
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
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
      message: 'Server error while creating user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, department, jobRole, experience, maxWorkload, phone, address, city, zipCode, isActive, isEmailVerified } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from modifying their own role or status
    if (user._id.toString() === req.user._id.toString()) {
      if (role !== undefined && role !== user.role) {
        return res.status(400).json({
          success: false,
          message: 'You cannot change your own role'
        });
      }
      if (isActive !== undefined && isActive !== user.isActive) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account'
        });
      }
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long'
        });
      }
      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot exceed 50 characters'
        });
      }
      if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Name can only contain letters and spaces'
        });
      }
      user.name = name.trim();
    }

    // Validate email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }

      user.email = email.toLowerCase().trim();
    }

    // Validate role if provided
    if (role !== undefined) {
      const validRoles = ['citizen', 'admin', 'field_staff'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }
      user.role = role;
    }

    // Validate department and job role if provided or if role is field_staff
    if (department !== undefined || role === 'field_staff') {
      if (user.role === 'field_staff') {
        const validDepartments = ['sanitation', 'water_supply', 'electricity', 'public_works'];
        const deptToUse = department || user.department;
        if (!deptToUse || !validDepartments.includes(deptToUse)) {
          return res.status(400).json({
            success: false,
            message: 'Department is required for field staff and must be one of: sanitation, water_supply, electricity, public_works'
          });
        }
        user.department = deptToUse;
      } else {
        // Clear department and job role if not field staff
        user.department = undefined;
        user.jobRole = undefined;
        user.experience = undefined;
        user.maxWorkload = undefined;
      }
    }

    // Validate job role for field staff
    if (jobRole !== undefined && user.role === 'field_staff') {
      user.jobRole = jobRole;
    }

    // Validate experience for field staff
    if (experience !== undefined && user.role === 'field_staff') {
      if (experience < 0 || experience > 50) {
        return res.status(400).json({
          success: false,
          message: 'Experience must be between 0 and 50 years'
        });
      }
      user.experience = experience;
    }

    // Validate max workload for field staff
    if (maxWorkload !== undefined && user.role === 'field_staff') {
      if (maxWorkload < 1 || maxWorkload > 50) {
        return res.status(400).json({
          success: false,
          message: 'Max workload must be between 1 and 50 complaints'
        });
      }
      user.maxWorkload = maxWorkload;
    }

    // Validate phone if provided
    if (phone !== undefined) {
      if (phone) {
        const digitsOnly = phone.replace(/[^\d]/g, '');
        if (digitsOnly.length !== 10 || !/^\d{10}$/.test(digitsOnly)) {
          return res.status(400).json({
            success: false,
            message: 'Phone number must be exactly 10 digits'
          });
        }
        user.phone = phone.trim();
      } else {
        user.phone = undefined;
      }
    }

    // Validate address if provided
    if (address !== undefined) {
      if (address && address.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Address cannot exceed 200 characters'
        });
      }
      user.address = address ? address.trim() : undefined;
    }

    // Validate city if provided
    if (city !== undefined) {
      if (city && city.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'City cannot exceed 50 characters'
        });
      }
      user.city = city ? city.trim() : undefined;
    }

    // Validate zipCode if provided
    if (zipCode !== undefined) {
      if (zipCode && zipCode.trim().length > 10) {
        return res.status(400).json({
          success: false,
          message: 'ZIP code cannot exceed 10 characters'
        });
      }
      user.zipCode = zipCode ? zipCode.trim() : undefined;
    }

    // Update status fields
    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    if (isEmailVerified !== undefined) {
      user.isEmailVerified = isEmailVerified;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
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
      message: 'Server error while updating user'
    });
  }
});

// @route   PUT /api/users/:id/toggle-status
// @desc    Toggle user active status (soft delete/restore)
// @access  Private (Admin only)
router.put('/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? 'activated' : 'deactivated';
    
    res.json({
      success: true,
      message: `User ${action} successfully`,
      user: {
        _id: user._id,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @route   POST /api/users/:id/export-data
// @desc    Export user data before deletion (GDPR compliance)
// @access  Private (Admin only)
router.post('/:id/export-data', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's complaints
    const complaints = await Complaint.find({ citizen: user._id })
      .select('title description category status priority submittedAt resolvedAt')
      .lean();

    // Create export data
    const exportData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isEmailVerified: user.isEmailVerified
      },
      complaints: complaints,
      exportedAt: new Date(),
      exportedBy: req.user.email
    };

    res.json({
      success: true,
      data: exportData,
      message: 'User data exported successfully'
    });

  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting user data'
    });
  }
});

// @route   DELETE /api/users/:id/hard-delete
// @desc    Permanently delete user and all associated data
// @access  Private (Admin only)
router.delete('/:id/hard-delete', async (req, res) => {
  try {
    const { confirmationCode, reason, adminPassword, dataExported } = req.body;

    // Validate required fields
    if (!confirmationCode || !reason || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        field: 'general'
      });
    }

    // Validate field lengths and content
    if (reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Deletion reason must be at least 10 characters long',
        field: 'reason'
      });
    }

    if (adminPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Admin password is required',
        field: 'adminPassword'
      });
    }

    // Data export is optional (for compliance purposes)
    // No validation required - admin can choose to export or not

    // Get user first to validate confirmation code
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify confirmation code (should be user's email)
    if (confirmationCode !== user.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation code. Please enter the user\'s email address exactly.',
        field: 'confirmationCode'
      });
    }

    // Verify admin password
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin || !admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found or invalid'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin password. Please check your password and try again.',
        field: 'adminPassword'
      });
    }

    // Prevent admin from deleting their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Log the deletion action for audit trail
    try {
      await AuditLog.logAction({
        action: 'hard_delete_user',
        entityType: 'user',
        entityId: user._id,
        performedBy: req.user._id,
        performedByEmail: req.user.email,
        reason: reason || 'No reason provided',
        details: {
          deletedUserName: user.name,
          deletedUserEmail: user.email,
          deletedUserRole: user.role,
          deletedUserCreatedAt: user.createdAt,
          confirmationCode: confirmationCode
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Failed to log audit action:', auditError);
      // Continue with deletion even if audit logging fails
    }

    // Delete user's complaints and associated data
    // Get user's complaints to delete associated files
    const userComplaints = await Complaint.find({ citizen: user._id });
    
    // Delete complaint images
    for (const complaint of userComplaints) {
      if (complaint.images && complaint.images.length > 0) {
        for (const image of complaint.images) {
          try {
            const imagePath = path.join(__dirname, '../uploads/complaints', image.filename);
            await fs.unlink(imagePath);
          } catch (error) {
            console.error('Error deleting complaint image:', error);
          }
        }
      }
      
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
    }

    // Delete user's avatar if it exists
    if (user.customAvatar) {
      try {
        const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.customAvatar));
        await fs.unlink(avatarPath);
      } catch (error) {
        console.error('Error deleting user avatar:', error);
      }
    }

    // Delete all user's complaints
    await Complaint.deleteMany({ citizen: user._id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User and all associated data permanently deleted',
      deletedUser: {
        name: user.name,
        email: user.email,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Hard delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while permanently deleting user'
    });
  }
});

// @route   POST /api/users/:id/resend-verification
// @desc    Resend email verification for user
// @access  Private (Admin only)
router.post('/:id/resend-verification', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('+otpCode +otpExpires +otpAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User email is already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    try {
      await sendOTPVerificationEmail(user, otp);
      // Verification OTP resent to user
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Still return success as OTP is generated
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending verification'
    });
  }
});

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Enhanced password strength validation
    const passwordChecks = {
      hasLowercase: /[a-z]/.test(newPassword),
      hasUppercase: /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword)
    };

    const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
    
    if (passwordScore < 3) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 3 of: lowercase, uppercase, number, special character'
      });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a Google-only account
    if (user.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset password for Google-authenticated accounts'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
});

// @route   POST /api/users/refresh-google-avatars
// @desc    Refresh Google photo URLs for all Google OAuth users
// @access  Private (Admin only)
router.post('/refresh-google-avatars', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    // Find all users with Google IDs
    const googleUsers = await User.find({ googleId: { $exists: true, $ne: null } });
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const user of googleUsers) {
      try {
        // Refresh the Google photo URL
        const refreshedUrl = user.refreshGooglePhotoUrl();
        if (refreshedUrl) {
          await user.save();
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error refreshing avatar for user ${user.email}:`, error);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Refreshed ${updatedCount} Google avatars. ${errorCount} errors occurred.`,
      updated: updatedCount,
      errors: errorCount,
      total: googleUsers.length
    });
    
  } catch (error) {
    console.error('Refresh Google avatars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while refreshing Google avatars'
    });
  }
});

module.exports = router;
