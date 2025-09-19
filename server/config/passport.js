const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId).select('-password');
    
    if (user) {
      return done(null, user);
    }
    
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google Profile:', profile);

    // Check if user already exists with this Google ID
    let existingUser = await User.findOne({ googleId: profile.id });
    
    if (existingUser) {
      // Update last login and refresh profile photo
      existingUser.lastLogin = new Date();
      // Always update the Google profile photo URL on each login
      if (profile.photos && profile.photos[0] && profile.photos[0].value) {
        let photoUrl = profile.photos[0].value;
        // Ensure proper formatting for Google photo URLs
        if (photoUrl.includes('googleusercontent.com')) {
          photoUrl = photoUrl.replace(/=s\d+-c$/, '').replace(/=s\d+$/, '') + '=s400-c';
        }
        existingUser.googlePhotoUrl = photoUrl;
      }
      await existingUser.save();
      return done(null, existingUser);
    }

    // Check if user exists with same email
    const emailUser = await User.findOne({ email: profile.emails[0].value });
    
    if (emailUser) {
      // Link Google account to existing email account
      emailUser.googleId = profile.id;
      // Store Google profile photo URL
      if (profile.photos && profile.photos[0] && profile.photos[0].value) {
        let photoUrl = profile.photos[0].value;
        // Ensure proper formatting for Google photo URLs
        if (photoUrl.includes('googleusercontent.com')) {
          photoUrl = photoUrl.replace(/=s\d+-c$/, '').replace(/=s\d+$/, '') + '=s400-c';
        }
        emailUser.googlePhotoUrl = photoUrl;
      }
      emailUser.isEmailVerified = true;
      emailUser.lastLogin = new Date();
      await emailUser.save();
      return done(null, emailUser);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      // Store Google profile photo URL
      googlePhotoUrl: (() => {
        if (profile.photos && profile.photos[0] && profile.photos[0].value) {
          let photoUrl = profile.photos[0].value;
          // Ensure proper formatting for Google photo URLs
          if (photoUrl.includes('googleusercontent.com')) {
            photoUrl = photoUrl.replace(/=s\d+-c$/, '').replace(/=s\d+$/, '') + '=s400-c';
          }
          return photoUrl;
        }
        return null;
      })(),
      isEmailVerified: true,
      role: 'citizen', // Default role for Google sign-ups
      lastLogin: new Date()
    });

    await newUser.save();
    return done(null, newUser);

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
