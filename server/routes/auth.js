const express = require('express');
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/User');
const { 
  generateToken, 
  authenticateToken, 
  setTokenCookie, 
  clearTokenCookie 
} = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, phone } = req.body;

    // Enhanced validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
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

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Phone validation (optional)
    if (phone) {
      // Remove all non-digit characters
      const digitsOnly = phone.replace(/[^\d]/g, '');
      
      // Check if we have exactly 10 digits
      if (digitsOnly.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits'
        });
      } else if (!/^\d{10}$/.test(digitsOnly)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must contain only digits'
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
    const validRoles = ['citizen', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'citizen',
      phone: phone ? phone.trim() : undefined
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie
    setTokenCookie(res, token);

    // Return user data (without password)
    const userProfile = user.getPublicProfile();

    // TODO: Send verification email here
    // For now, we'll just log the token
    console.log('Email verification token:', verificationToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user: userProfile,
      requiresEmailVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = generateToken(user._id);
    
    // Set cookie with appropriate expiry
    const cookieOptions = {
      expires: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    res.cookie('token', token, cookieOptions);

    // Return user data (without password)
    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  // Clear the token cookie
  clearTokenCookie(res);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      // For Google OAuth users, automatically verify their email
      if (req.user.googleId && !req.user.isEmailVerified) {
        req.user.isEmailVerified = true;
        await req.user.save();
      }

      // Generate token for the authenticated user
      const token = generateToken(req.user._id);
      
      // Set cookie
      setTokenCookie(res, token);

      // Determine redirect URL based on user role
      const redirectUrl = req.user.role === 'admin' 
        ? `${process.env.CLIENT_URL}/admin-dashboard`
        : `${process.env.CLIENT_URL}/citizen-dashboard`;
      
      // Redirect to frontend with success and user data
      res.redirect(`${redirectUrl}?auth=success&token=${token}`);

    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name.trim();
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with verification token
    const user = await User.findOne({
      emailVerificationToken: crypto
        .createHash('sha256')
        .update(token)
        .digest('hex'),
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify email
    const isVerified = user.verifyEmail(token);
    
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email verification failed'
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+emailVerificationToken +emailVerificationExpires');

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // TODO: Send verification email here
    console.log('New email verification token:', verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resend verification'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
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

    const user = await User.findById(req.user._id).select('+password');

    // Check if user has a password (not a Google-only account)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for Google-authenticated accounts'
      });
    }

    // Verify current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

module.exports = router;
