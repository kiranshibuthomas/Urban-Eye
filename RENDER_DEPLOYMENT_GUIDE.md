# Render Deployment Guide for UrbanEye

## Fixed Issues
✅ **Module Not Found Error**: Updated root `package.json` to include all server dependencies
✅ **Start Command**: Changed start script to run `node server/server.js` directly
✅ **Build Configuration**: Added proper build scripts for Render

## Render Configuration

### 1. Service Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x or higher

### 2. Environment Variables
Add these environment variables in your Render dashboard:

**Note**: Replace the placeholder values below with your actual credentials from `server/config.env`:

```
# Database Configuration
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=30m

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server Configuration
NODE_ENV=production

# Frontend URL (Update with your Render frontend URL)
CLIENT_URL=https://your-frontend-app.onrender.com

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=UrbanEye <noreply@urbaneye.com>
```

### 3. Important Notes
- **PORT**: Render automatically sets the PORT environment variable, so you don't need to set it manually
- **CLIENT_URL**: Update this to your actual frontend URL once deployed
- **NODE_ENV**: Set to `production` for Render deployment

### 4. Deployment Steps
1. Push your changes to GitHub
2. In Render dashboard, create a new Web Service
3. Connect your GitHub repository
4. Use the settings above
5. Add all environment variables
6. Deploy!

### 5. Frontend Deployment
For the React frontend, you'll need to:
1. Create a separate Static Site service in Render
2. Set the build command to: `cd client && npm install && npm run build`
3. Set the publish directory to: `client/build`
4. Update the CLIENT_URL in your backend environment variables

## Troubleshooting
- If you get module errors, ensure all dependencies are in the root `package.json`
- Check that environment variables are properly set
- Verify your MongoDB connection string is correct
- Make sure your Google OAuth redirect URIs include your Render domain
