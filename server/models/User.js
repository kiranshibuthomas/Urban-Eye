const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if googleId is not present
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['citizen', 'admin'],
    default: 'citizen',
    required: true
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple documents without this field
    unique: true
  },
  googlePhotoUrl: {
    type: String,
    default: null
  },
  customAvatar: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  otpCode: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  otpAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  passwordResetOTP: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  passwordResetAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        if (!phone) return true; // Optional field
        
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/[^\d]/g, '');
        
        // Check if we have exactly 10 digits
        return digitsOnly.length === 10 && /^\d{10}$/.test(digitsOnly);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City cannot be more than 50 characters']
  },
  zipCode: {
    type: String,
    trim: true,
    maxlength: [10, 'ZIP code cannot be more than 10 characters']
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get live avatar URL
userSchema.methods.getLiveAvatarUrl = function() {
  // Priority 1: Custom uploaded avatar
  if (this.customAvatar) {
    return this.customAvatar;
  }
  
  // Priority 2: Google OAuth photo
  if (this.googleId && this.googlePhotoUrl) {
    // Make sure it's not the invalid placeholder
    if (this.googlePhotoUrl !== 'https://lh3.googleusercontent.com/a/default-user=s400') {
      // Try to fix the Google photo URL to make it more accessible
      let googleUrl = this.googlePhotoUrl;
      
      // Ensure the URL has proper size parameter and is public
      if (googleUrl.includes('googleusercontent.com')) {
        // Remove any existing size parameters and add s400-c for better compatibility
        googleUrl = googleUrl.replace(/=s\d+-c$/, '').replace(/=s\d+$/, '') + '=s400-c';
        
        // Add additional parameters to make the image more accessible
        if (!googleUrl.includes('?')) {
          googleUrl += '?sz=400';
        }
      }
      
      return googleUrl;
    }
  }
  
  // Priority 3: Fallback to initials-based avatar service
  const initials = this.name ? this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const colorIndex = this.email ? this.email.charCodeAt(0) % colors.length : 0;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=400&background=${colors[colorIndex]}&color=fff&bold=true`;
};

// Instance method to refresh Google photo URL
userSchema.methods.refreshGooglePhotoUrl = function() {
  if (this.googleId && this.googlePhotoUrl) {
    // Try to get a fresh Google photo URL
    let googleUrl = this.googlePhotoUrl;
    
    if (googleUrl.includes('googleusercontent.com')) {
      // Remove any existing size parameters and add s400-c for better compatibility
      googleUrl = googleUrl.replace(/=s\d+-c$/, '').replace(/=s\d+$/, '') + '=s400-c';
      
      // Add additional parameters to make the image more accessible
      if (!googleUrl.includes('?')) {
        googleUrl += '?sz=400';
      }
      
      // Update the stored URL
      this.googlePhotoUrl = googleUrl;
      return googleUrl;
    }
  }
  
  return null;
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  
  // Add live avatar URL
  userObject.avatar = this.getLiveAvatarUrl();
  
  return userObject;
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Instance method to verify email
userSchema.methods.verifyEmail = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  if (this.emailVerificationToken !== hashedToken) {
    return false;
  }
  
  if (this.emailVerificationExpires < Date.now()) {
    return false;
  }
  
  this.isEmailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  
  return true;
};

// Instance method to generate OTP
userSchema.methods.generateOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.otpCode = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.otpAttempts = 0;
  
  return otp;
};

// Instance method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  // Check if OTP exists and hasn't expired
  if (!this.otpCode || !this.otpExpires) {
    return { success: false, message: 'No OTP found' };
  }
  
  if (this.otpExpires < Date.now()) {
    return { success: false, message: 'OTP has expired' };
  }
  
  // Check attempt limit (max 3 attempts)
  if (this.otpAttempts >= 3) {
    return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  // Verify OTP
  if (this.otpCode !== otp) {
    this.otpAttempts += 1;
    return { success: false, message: 'Invalid OTP' };
  }
  
  // OTP is correct - verify email and clear OTP
  this.isEmailVerified = true;
  this.otpCode = undefined;
  this.otpExpires = undefined;
  this.otpAttempts = 0;
  
  return { success: true, message: 'Email verified successfully' };
};

// Instance method to generate password reset OTP
userSchema.methods.generatePasswordResetOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.passwordResetOTP = otp;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.passwordResetAttempts = 0;
  
  return otp;
};

// Instance method to verify password reset OTP
userSchema.methods.verifyPasswordResetOTP = function(otp) {
  // Check if OTP exists and hasn't expired
  if (!this.passwordResetOTP || !this.passwordResetExpires) {
    return { success: false, message: 'No password reset OTP found' };
  }
  
  if (this.passwordResetExpires < Date.now()) {
    return { success: false, message: 'Password reset OTP has expired' };
  }
  
  // Check attempt limit (max 3 attempts)
  if (this.passwordResetAttempts >= 3) {
    return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  // Verify OTP
  if (this.passwordResetOTP !== otp) {
    this.passwordResetAttempts += 1;
    return { success: false, message: 'Invalid OTP' };
  }
  
  // OTP is correct - clear OTP and allow password reset
  this.passwordResetOTP = undefined;
  this.passwordResetExpires = undefined;
  this.passwordResetAttempts = 0;
  
  return { success: true, message: 'OTP verified successfully' };
};

// Static method to find user by email or googleId
userSchema.statics.findByEmailOrGoogleId = function(email, googleId) {
  const query = {};
  if (email) query.email = email;
  if (googleId) query.googleId = googleId;
  
  return this.findOne({
    $or: [
      { email: email },
      { googleId: googleId }
    ]
  });
};

// Virtual for user's complaints (will be useful later)
userSchema.virtual('complaints', {
  ref: 'Complaint',
  localField: '_id',
  foreignField: 'citizen'
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
