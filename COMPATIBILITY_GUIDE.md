# UrbanEye Web & Mobile Compatibility Guide

This guide ensures that both the web application and React Native mobile app work seamlessly together with the same backend API.

## Version Compatibility Matrix

| Component | Web App | Mobile App | Backend | Status |
|-----------|---------|------------|---------|--------|
| React | 18.2.0 | 18.2.0 | - | ✅ Compatible |
| Node.js | 16+ | 16+ | 16+ | ✅ Compatible |
| Axios | 1.5.0 | 1.5.0 | - | ✅ Compatible |
| JWT Auth | ✅ | ✅ | ✅ | ✅ Compatible |

## API Endpoint Compatibility

Both applications use the same API endpoints and data structures:

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/resend-verification` - Resend email verification
- `GET /api/auth/verify-email/:token` - Verify email

### Data Models

#### User Model
```javascript
{
  _id: String,
  name: String,
  email: String,
  role: 'citizen' | 'admin',
  phone: String,
  address: String,
  city: String,
  zipCode: String,
  isEmailVerified: Boolean,
  isActive: Boolean,
  preferences: {
    emailNotifications: Boolean,
    smsNotifications: Boolean,
    pushNotifications: Boolean
  },
  createdAt: Date,
  lastLogin: Date
}
```

#### Complaint Model
```javascript
{
  _id: String,
  title: String,
  description: String,
  category: String,
  location: String,
  priority: 'Low' | 'Medium' | 'High',
  status: 'pending' | 'in-progress' | 'resolved',
  reporter: {
    _id: String,
    name: String,
    email: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Shared Configuration

### Environment Variables

Both apps should use the same environment configuration:

```env
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/urbaneye
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000

# Frontend (Web)
REACT_APP_API_URL=http://localhost:5000/api

# Mobile
API_BASE_URL=http://localhost:5000/api
```

### API Base URL Configuration

**Web App** (`client/src/context/AuthContext.js`):
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

**Mobile App** (`mobile/src/context/AuthContext.js`):
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## Authentication Flow

Both applications follow the same authentication flow:

1. **Login/Register**: User submits credentials
2. **Token Generation**: Backend returns JWT token
3. **Token Storage**: 
   - Web: localStorage
   - Mobile: AsyncStorage
4. **API Requests**: Include token in Authorization header
5. **Token Refresh**: Handle token expiration gracefully

### Token Management

```javascript
// Web App
localStorage.setItem('token', token);
localStorage.removeItem('token');

// Mobile App
await AsyncStorage.setItem('token', token);
await AsyncStorage.removeItem('token');
```

## Error Handling

Both applications handle errors consistently:

```javascript
// Standard error response format
{
  success: false,
  message: "Error description",
  error?: "Detailed error info (development only)"
}

// Standard success response format
{
  success: true,
  message: "Success description",
  data?: "Response data"
}
```

## Feature Parity

### ✅ Implemented in Both Apps

- User authentication (login/register)
- User profile management
- Dashboard overview
- Submit complaints
- View complaint history
- Analytics and statistics
- Dark/light theme toggle
- Settings management

### 🔄 Web-Only Features (Future Mobile Implementation)

- Email verification flow
- Google OAuth integration
- Advanced filtering and search
- Export functionality
- Detailed admin panels

### 📱 Mobile-Only Features (Future Web Implementation)

- Push notifications
- Location services
- Camera integration
- Offline support

## Development Workflow

### 1. Backend First
Always implement API endpoints in the backend first, then update both frontends.

### 2. Test API Endpoints
Use tools like Postman or curl to test endpoints before implementing in frontends.

### 3. Update Both Apps
When adding new features, update both web and mobile apps to maintain parity.

### 4. Version Control
- Keep API versioning consistent
- Update both apps when API changes
- Document breaking changes

## Testing Strategy

### API Testing
```bash
# Test backend endpoints
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Frontend Testing
```bash
# Web app
cd client
npm test

# Mobile app
cd mobile
npm test
```

### Integration Testing
1. Start backend server
2. Start web app
3. Start mobile app
4. Test same functionality on both platforms

## Deployment Considerations

### Web App Deployment
- Build optimized production bundle
- Configure environment variables
- Set up proper CORS headers

### Mobile App Deployment
- Generate signed APK/AAB for Android
- Archive and upload to App Store for iOS
- Configure production API endpoints

### Backend Deployment
- Ensure CORS allows both web and mobile origins
- Set up proper environment variables
- Configure database connections

## Troubleshooting Common Issues

### CORS Errors
```javascript
// Backend CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', // Web app
    'http://localhost:8081', // Metro bundler
    'exp://localhost:19000'  // Expo development
  ],
  credentials: true
}));
```

### Authentication Issues
- Check token format and expiration
- Verify API base URL configuration
- Ensure proper error handling

### API Connection Issues
- Verify backend server is running
- Check network connectivity
- Validate API endpoint URLs

## Performance Optimization

### Web App
- Code splitting and lazy loading
- Optimize bundle size
- Implement caching strategies

### Mobile App
- Optimize image loading
- Implement proper list virtualization
- Use React Native Performance Monitor

### Backend
- Implement proper indexing
- Use caching (Redis)
- Optimize database queries

## Security Considerations

### Both Apps
- Validate all user inputs
- Implement proper error handling
- Use HTTPS in production
- Secure token storage

### Mobile Specific
- Secure AsyncStorage usage
- Implement certificate pinning
- Protect against reverse engineering

### Web Specific
- Implement CSP headers
- Use secure cookies
- Protect against XSS attacks

## Future Enhancements

### Planned Features
- Real-time notifications
- Offline support
- Advanced analytics
- Multi-language support
- Accessibility improvements

### Technical Improvements
- GraphQL implementation
- WebSocket integration
- Progressive Web App (PWA)
- React Native Web support

## Support and Maintenance

### Regular Tasks
- Update dependencies regularly
- Monitor API performance
- Review security vulnerabilities
- Test cross-platform compatibility

### Documentation
- Keep API documentation updated
- Maintain changelog
- Document breaking changes
- Update setup instructions

This compatibility guide ensures that both the web and mobile applications work seamlessly together while maintaining code quality and user experience consistency.
