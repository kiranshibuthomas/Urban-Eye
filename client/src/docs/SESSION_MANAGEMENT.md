# Session Management System

## Overview

The UrbanEye application includes a simplified session management system that provides automatic token refresh, session timeout handling, and multi-tab synchronization. The system uses a fixed 10-minute session timeout for security and simplicity.

## Features

### 🔄 Automatic Token Refresh
- Tokens are automatically refreshed every 5 minutes
- Prevents session expiration during active use
- Seamless user experience with no interruptions

### ⏰ Session Timeout Management
- Fixed 10-minute session timeout for security
- Warning notifications 2 minutes before session expires
- Automatic logout on timeout
- Activity tracking to extend sessions

### 🔄 Multi-Tab Synchronization
- Session state synchronized across all browser tabs
- Logout in one tab logs out all tabs
- Token refresh updates all tabs simultaneously

### 🛡️ Security Features
- Secure token storage in httpOnly cookies
- Automatic cleanup on logout
- Activity-based session extension
- Protection against session hijacking

## Components

### SessionManager Service (`client/src/services/sessionManager.js`)
Core service that handles all session management logic:
- Token refresh automation
- Activity tracking
- Session timeout monitoring
- Multi-tab synchronization
- Event system for session events

### SessionContext (`client/src/context/SessionContext.js`)
React context that provides session management throughout the app:
- Session status state
- Session actions (extend, logout, settings)
- Event listeners for session changes
- Automatic navigation on session expiry

### SessionStatus Component (`client/src/components/SessionStatus.js`)
UI component that displays current session information:
- Session status indicator
- Time until timeout
- Last activity timestamp
- Manual session extension
- Expandable details view

### SessionSettings Component (`client/src/components/SessionSettings.js`)
Configuration interface for session preferences:
- Session timeout settings
- Warning time configuration
- Token refresh interval
- Real-time session status
- Validation and error handling

### SessionSettingsPage (`client/src/pages/SessionSettingsPage.js`)
Dedicated page for session management:
- Complete session settings interface
- Security information and tips
- Current session status display
- Navigation back to appropriate dashboard

## API Endpoints

### POST `/api/auth/refresh`
Refreshes the authentication token:
- Requires valid authentication
- Returns new token and user data
- Updates httpOnly cookie
- Used automatically by session manager

## Configuration

### Default Settings
```javascript
{
  sessionTimeout: 30 * 60 * 1000,    // 30 minutes
  warningTime: 5 * 60 * 1000,        // 5 minutes
  refreshInterval: 10 * 60 * 1000    // 10 minutes
}
```

### User Settings Storage
Settings are stored in localStorage and can be customized by users:
- `sessionSettings`: User's custom session preferences
- Automatically loaded on app initialization
- Validated before application

## Usage

### Basic Integration
```javascript
import { useSession } from '../context/SessionContext';

function MyComponent() {
  const { sessionStatus, extendSession, logout } = useSession();
  
  // Check session status
  if (sessionStatus.isExpired) {
    // Handle expired session
  }
  
  // Extend session manually
  const handleExtend = () => {
    extendSession();
  };
}
```

### Session Events
```javascript
import sessionManager from '../services/sessionManager';

// Listen for session events
const removeListener = sessionManager.addListener((event, data) => {
  switch (event) {
    case 'timeout':
      // Handle session timeout
      break;
    case 'refresh':
      // Handle token refresh
      break;
    case 'logout':
      // Handle logout
      break;
  }
});

// Cleanup
removeListener();
```

## Security Considerations

### Token Security
- Tokens stored in httpOnly cookies (not accessible via JavaScript)
- Automatic token refresh prevents long-lived tokens
- Secure cookie settings (SameSite, Secure in production)

### Session Protection
- Activity tracking prevents unauthorized access
- Automatic logout on inactivity
- Multi-tab synchronization prevents session confusion
- Secure storage cleanup on logout

### User Privacy
- No sensitive data stored in localStorage
- Session settings are user-specific
- Automatic cleanup of temporary data

## Browser Compatibility

### Supported Features
- Modern browsers with localStorage support
- Event listeners for activity tracking
- Storage events for multi-tab sync
- Visibility API for tab focus detection

### Fallbacks
- Graceful degradation for older browsers
- Manual session extension as fallback
- Basic timeout handling without advanced features

## Troubleshooting

### Common Issues

#### Session Expires Too Quickly
- Check session timeout settings
- Verify activity tracking is working
- Ensure token refresh is functioning

#### Multi-Tab Issues
- Verify localStorage is enabled
- Check for browser extensions blocking storage events
- Ensure all tabs are from same origin

#### Token Refresh Failures
- Check network connectivity
- Verify server endpoint is accessible
- Review browser console for errors

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('sessionDebug', 'true');
```

## Future Enhancements

### Planned Features
- [ ] Remember device functionality
- [ ] Session analytics and reporting
- [ ] Advanced security options
- [ ] Mobile app integration
- [ ] Session sharing between devices

### Configuration Options
- [ ] Role-based session settings
- [ ] Department-specific timeouts
- [ ] Custom warning messages
- [ ] Session activity logging

## Support

For issues or questions about the session management system:
1. Check the browser console for error messages
2. Verify session settings are properly configured
3. Test with different browsers and devices
4. Review the troubleshooting section above

## Changelog

### Version 1.0.0
- Initial implementation of session management system
- Automatic token refresh
- Session timeout handling
- Multi-tab synchronization
- User-configurable settings
- Security enhancements
