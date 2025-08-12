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
  avatar: {
    type: String,
    default: ''
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

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
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
