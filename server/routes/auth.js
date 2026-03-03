const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/User');
const { 
  generateToken, 
  generateRefreshToken,
  authenticateToken, 
  setTokenCookie, 
  setRefreshTokenCookie,
  clearTokenCookie 
} = require('../middleware/auth');
const { sendOTPVerificationEmail, sendPasswordResetOTPEmail } = require('../services/emailService');
const smsService = require('../services/smsService');
const upload = require('../middleware/upload');
const { isCloudinaryConfigured, deleteFromCloudinary, extractPublicId } = require('../services/cloudinaryService');
const { processOAuthAvatar, cleanupUserAvatars } = require('../services/avatarService');

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

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Set cookies with appropriate expiry times
    setTokenCookie(res, token);
    setRefreshTokenCookie(res, refreshToken);

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
// @desc    Refresh authentication token using refresh token
// @access  Public (uses refresh token)
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken;

    // Check for refresh token in cookies
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new access token
    const newToken = generateToken(user._id);
    
    // Set new token in httpOnly cookie
    setTokenCookie(res, newToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

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

      // Process and backup Google profile photo to Cloudinary
      if (req.user.googlePhotoUrl) {
        try {
          await processOAuthAvatar(req.user, req.user.googlePhotoUrl);
        } catch (avatarError) {
          console.error('Error processing Google avatar:', avatarError);
          // Don't fail the login if avatar processing fails
        }
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
// @desc    Refresh Google profile photo backup to Cloudinary
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

    // If user has a Google photo URL, backup to Cloudinary
    if (user.googlePhotoUrl) {
      try {
        await processOAuthAvatar(user, user.googlePhotoUrl);
        
        res.json({
          success: true,
          message: 'Google profile photo refreshed and backed up to cloud storage',
          user: user.getPublicProfile()
        });
      } catch (avatarError) {
        console.error('Error refreshing Google avatar:', avatarError);
        res.status(500).json({
          success: false,
          message: 'Failed to refresh Google profile photo'
        });
      }
    } else {
      // Clear any invalid URLs to force fallback to Gravatar
      user.googlePhotoUrl = null;
      await user.save();
      
      res.json({
        success: true,
        message: 'Avatar refreshed successfully',
        user: user.getPublicProfile()
      });
    }
    
  } catch (error) {
    console.error('Refresh Google avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar refresh'
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
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old custom avatar if it exists
    if (user.customAvatar) {
      try {
        // Extract public ID from Cloudinary URL and delete
        const publicId = extractPublicId(user.customAvatar);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'image');
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Update user with new avatar URL
    const avatarUrl = req.file.path; // Cloudinary URL
    const publicId = req.file.public_id;
    
    user.customAvatar = avatarUrl;
    user.avatarPublicId = publicId; // Store for future deletion
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    
    // Clean up uploaded file from Cloudinary if there was an error
    if (req.file && req.file.public_id) {
      try {
        await deleteFromCloudinary(req.file.public_id, 'image');
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
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

    // Delete the avatar file
    try {
      // Delete from Cloudinary
      if (user.avatarPublicId) {
        await deleteFromCloudinary(user.avatarPublicId, 'image');
      } else {
        // Fallback: extract public ID from URL
        const publicId = extractPublicId(user.customAvatar);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'image');
        }
      }
    } catch (error) {
      console.error('Error deleting avatar file:', error);
    }

    // Remove custom avatar from user record
    user.customAvatar = null;
    user.avatarPublicId = null;
    await user.save();

    // Determine appropriate success message based on available fallback
    let message = 'Custom avatar deleted successfully.';
    if (user.googlePhotoBackup || user.googlePhotoUrl) {
      message += ' Your Google profile photo will now be displayed.';
    } else if (user.email) {
      message += ' Your Gravatar will now be displayed.';
    } else {
      message += ' Default avatar will now be displayed.';
    }

    res.json({
      success: true,
      message: message,
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

// @route   POST /api/auth/send-complaint-otp
// @desc    Send OTP for complaint verification (phone/email)
// @access  Public
router.post('/send-complaint-otp', async (req, res) => {
  try {
    const { type, value, purpose } = req.body;

    if (!type || !value || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Type, value, and purpose are required'
      });
    }

    if (!['phone', 'email'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either phone or email'
      });
    }

    if (purpose !== 'complaint_verification') {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose'
      });
    }

    // Validate contact value
    if (type === 'phone') {
      const validation = smsService.validatePhoneNumber(value);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session/memory (in production, use Redis or database)
    // For now, we'll use a simple in-memory store
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    const otpKey = `${type}_${value}_${purpose}`;
    global.otpStore.set(otpKey, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    let sendResult;
    
    try {
      if (type === 'phone') {
        // Use SMS service
        const cleanedPhone = smsService.validatePhoneNumber(value).cleaned;
        sendResult = await smsService.sendOTP(cleanedPhone, otp, purpose);
      } else {
        // TODO: Use email service for email OTPs
        console.log(`Email OTP ${otp} for ${value}`);
        sendResult = { success: true, provider: 'email' };
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      // In development, still return success but log the error
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: OTP ${otp} for ${type} ${value}`);
        sendResult = { success: true, provider: 'development', developmentMode: true };
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }
    }

    const response = {
      success: true,
      message: `OTP sent successfully to your ${type === 'phone' ? 'mobile number' : 'email'}`,
      expiresIn: '10 minutes'
    };

    // In development mode, include the OTP for testing
    if (process.env.NODE_ENV === 'development' && sendResult.developmentMode) {
      response.developmentOTP = otp;
      response.note = 'OTP shown for development testing only';
    }

    res.json(response);

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP sending'
    });
  }
});

// @route   POST /api/auth/verify-complaint-otp
// @desc    Verify OTP for complaint verification
// @access  Public
router.post('/verify-complaint-otp', async (req, res) => {
  try {
    const { type, value, otp, purpose } = req.body;

    if (!type || !value || !otp || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Type, value, OTP, and purpose are required'
      });
    }

    if (!['phone', 'email'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either phone or email'
      });
    }

    if (purpose !== 'complaint_verification') {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose'
      });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit number'
      });
    }

    // Check OTP from store
    if (!global.otpStore) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    const otpKey = `${type}_${value}_${purpose}`;
    const storedOtpData = global.otpStore.get(otpKey);

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (Date.now() > storedOtpData.expires) {
      global.otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check attempts
    if (storedOtpData.attempts >= 3) {
      global.otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts++;
      global.otpStore.set(otpKey, storedOtpData);
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - storedOtpData.attempts} attempts remaining.`
      });
    }

    // OTP verified successfully
    global.otpStore.delete(otpKey);

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   GET /api/auth/sms-status
// @desc    Get SMS service status (development only)
// @access  Public
router.get('/sms-status', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not available in production'
      });
    }

    const status = smsService.getProviderStatus();
    
    res.json({
      success: true,
      smsService: status,
      message: status.provider === 'console' 
        ? 'SMS service is in development mode. OTPs will be shown in server console and frontend toast.'
        : `SMS service configured with ${status.provider}`
    });

  } catch (error) {
    console.error('SMS status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
