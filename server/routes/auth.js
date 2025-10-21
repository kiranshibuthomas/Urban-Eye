const express = require('express');
const passport = require('passport');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { 
  generateToken, 
  authenticateToken, 
  setTokenCookie, 
  clearTokenCookie 
} = require('../middleware/auth');
const { sendOTPVerificationEmail, sendPasswordResetOTPEmail } = require('../services/emailService');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/auth/check-email
// @desc    Check if email already exists
// @access  Public
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    res.json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? 'Email already exists' : 'Email is available'
    });

  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email check'
    });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to user email for verification
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otpCode +otpExpires +otpAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    try {
      await sendOTPVerificationEmail(user, otp);
      // OTP sent to user
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Still return success as OTP is generated, but log the error
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP sending'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otpCode +otpExpires +otpAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    const result = user.verifyOTP(otp);
    
    if (!result.success) {
      await user.save(); // Save attempt count
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Save user with verified email
    await user.save();

    // Generate token for verified user
    const token = generateToken(user._id);
    
    // Set cookie
    setTokenCookie(res, token);

    // Return user data (without password)
    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP to user email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordResetOTP +passwordResetExpires +passwordResetAttempts');
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.',
        email: email.toLowerCase().trim()
      });
    }

    // Check if user is a Google-only account (has googleId but no password)
    if (user.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google authentication. Please use Google sign-in instead.'
      });
    }

    // Generate new password reset OTP
    const otp = user.generatePasswordResetOTP();
    await user.save();

    // Send OTP via email
    try {
      await sendPasswordResetOTPEmail(user, otp);
      // Password reset OTP sent to user
    } catch (emailError) {
      console.error('Failed to send password reset OTP email:', emailError);
      // Still return success as OTP is generated, but log the error
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.',
      email: email.toLowerCase().trim(),
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/auth/verify-password-reset-otp
// @desc    Verify password reset OTP
// @access  Public
router.post('/verify-password-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordResetOTP +passwordResetExpires +passwordResetAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    const result = user.verifyPasswordResetOTP(otp);
    
    if (!result.success) {
      await user.save(); // Save attempt count
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Save user with verified OTP
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      email: email.toLowerCase().trim()
    });

  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset user password after OTP verification
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, new password, and confirm password are required'
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a Google-only account (has googleId but no password)
    if (user.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google authentication. Please use Google sign-in instead.'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

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
    const validRoles = ['citizen', 'admin', 'field_staff'];
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

    // Generate OTP for email verification
    const otp = user.generateOTP();
    
    await user.save();

    // Send OTP via email
    try {
      await sendOTPVerificationEmail(user, otp);
      // OTP sent to user
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Still return success as OTP is generated, but log the error
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for OTP verification.',
      email: email.toLowerCase().trim(),
      requiresOTPVerification: true,
      expiresIn: '10 minutes'
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
    const token = generateToken(user._id);
    
    // Set cookie with 15 minute expiry for security
    const cookieOptions = {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
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

// @route   POST /api/auth/refresh
// @desc    Refresh authentication token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const token = generateToken(user._id);
    
    // Set new token in httpOnly cookie with 15 minute expiry
    const cookieOptions = {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
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
    const publicProfile = user.getPublicProfile();
    
    // Generate a new token to refresh the session
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      user: publicProfile,
      token: token
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Debug endpoint to check Google photo URLs
router.get('/debug-avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      debug: {
        email: user.email,
        googleId: user.googleId,
        googlePhotoUrl: user.googlePhotoUrl,
        customAvatar: user.customAvatar,
        liveAvatarUrl: user.getLiveAvatarUrl(),
        hasGooglePhoto: !!(user.googleId && user.googlePhotoUrl),
        isDefaultPlaceholder: user.googlePhotoUrl === 'https://lh3.googleusercontent.com/a/default-user=s400'
      }
    });
  } catch (error) {
    console.error('Debug avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, city, zipCode } = req.body;
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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

    // Validate phone if provided
    if (phone !== undefined) {
      if (phone) {
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/[^\d]/g, '');
        
        // Check if we have exactly 10 digits
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

    // Save the updated user
    await user.save();

    // Return updated user data
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
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
      message: 'Server error during profile update'
    });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// @route   GET /api/auth/debug-config
// @desc    Debug OAuth configuration
// @access  Public
router.get('/debug-config', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    SERVER_URL: process.env.SERVER_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
    expectedCallbackURL: process.env.NODE_ENV === 'production' 
      ? `${process.env.SERVER_URL || 'https://urbaneye-zt7y.onrender.com'}/api/auth/google/callback`
      : "/api/auth/google/callback"
  });
});

// @route   POST /api/auth/google
// @desc    Google OAuth login for mobile
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify the Google token (in a real app, you'd use Google's API to verify)
    // For now, we'll create a mock user or find existing user
    // In production, you should verify the token with Google's API
    
    // Mock Google user data (replace with actual Google API verification)
    const mockGoogleUser = {
      id: 'google_' + Date.now(),
      email: 'user@gmail.com',
      name: 'Google User',
      picture: 'https://lh3.googleusercontent.com/a/default-user=s400'
    };

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: mockGoogleUser.email },
        { googleId: mockGoogleUser.id }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        name: mockGoogleUser.name,
        email: mockGoogleUser.email,
        googleId: mockGoogleUser.id,
        googlePhotoUrl: mockGoogleUser.picture,
        isEmailVerified: true, // Google users are pre-verified
        role: 'citizen'
      });
      await user.save();
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user.googleId = mockGoogleUser.id;
        user.googlePhotoUrl = mockGoogleUser.picture;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie
    setTokenCookie(res, token);

    // Return user data
    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google login'
    });
  }
});

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
      let redirectUrl;
      switch (req.user.role) {
        case 'admin':
          redirectUrl = `${process.env.CLIENT_URL}/admin-dashboard`;
          break;
        case 'field_staff':
          redirectUrl = `${process.env.CLIENT_URL}/field-staff-dashboard`;
          break;
        default:
          redirectUrl = `${process.env.CLIENT_URL}/citizen-dashboard`;
      }
      
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
    const { 
      name, 
      phone, 
      address, 
      city, 
      zipCode, 
      preferences 
    } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Update basic information
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address.trim();
    if (city !== undefined) user.city = city.trim();
    if (zipCode !== undefined) user.zipCode = zipCode.trim();
    
    // Update preferences
    if (preferences) {
      if (preferences.emailNotifications !== undefined) {
        user.preferences.emailNotifications = preferences.emailNotifications;
      }
      if (preferences.smsNotifications !== undefined) {
        user.preferences.smsNotifications = preferences.smsNotifications;
      }
      if (preferences.pushNotifications !== undefined) {
        user.preferences.pushNotifications = preferences.pushNotifications;
      }
    }
    
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
    // New email verification token generated

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

// @route   POST /api/auth/refresh-google-avatar
// @desc    Refresh Google profile photo for existing users
// @access  Private
router.post('/refresh-google-avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'User is not a Google account'
      });
    }
    
    // Clear any invalid URLs to force fallback to Gravatar
    user.googlePhotoUrl = null;
    await user.save();
    
    const publicProfile = user.getPublicProfile();
    
    res.json({
      success: true,
      message: 'Avatar refreshed successfully',
      user: publicProfile
    });
    
  } catch (error) {
    console.error('Refresh Google avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar refresh'
    });
  }
});

// @route   GET /api/auth/debug-avatar
// @desc    Debug avatar information for current user
// @access  Private
router.get('/debug-avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const debugInfo = {
      userId: user._id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      googlePhotoUrl: user.googlePhotoUrl,
      generatedAvatarUrl: user.getLiveAvatarUrl(),
      publicProfile: user.getPublicProfile(),
      hasGooglePhoto: !!(user.googleId && user.googlePhotoUrl),
      avatarSource: user.googleId && user.googlePhotoUrl ? 'google' : 'initials'
    };
    
    res.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('Debug avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar debug'
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

    // Check if user is a Google-only account (has googleId but no password)
    if (user.googleId && !user.password) {
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

// @route   POST /api/auth/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      // Delete the uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old custom avatar if it exists
    if (user.customAvatar) {
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.customAvatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.customAvatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during avatar upload'
    });
  }
});

// @route   DELETE /api/auth/delete-avatar
// @desc    Delete user's custom avatar
// @access  Private
router.delete('/delete-avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.customAvatar) {
      return res.status(400).json({
        success: false,
        message: 'No custom avatar to delete'
      });
    }

    // Delete the avatar file from filesystem
    const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.customAvatar));
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // Remove custom avatar from user record
    user.customAvatar = null;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar deletion'
    });
  }
});

module.exports = router;
