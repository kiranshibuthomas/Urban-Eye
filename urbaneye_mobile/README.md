# UrbanEye Mobile App

A Flutter mobile application for the UrbanEye citizen complaint management system. This app works seamlessly with the existing Node.js backend to provide a native mobile experience for both citizens and administrators.

## Features

### For Citizens
- **User Authentication**: Secure login/register with email verification
- **Dashboard**: Overview of complaint statistics and recent activity
- **Complaint Management**: Create, view, and track complaint status
- **Location Services**: Report issues with GPS location
- **Photo Upload**: Attach images to complaints
- **Push Notifications**: Real-time updates on complaint status
- **Profile Management**: Update personal information and preferences

### For Administrators
- **Admin Dashboard**: System overview and statistics
- **Complaint Management**: Review, assign, and resolve complaints
- **User Management**: Manage citizen accounts
- **Analytics**: View reports and insights
- **Notification Management**: Send updates to citizens

## Technical Stack

- **Framework**: Flutter 3.0+
- **State Management**: Provider
- **HTTP Client**: Dio & HTTP
- **Local Storage**: SharedPreferences & Secure Storage
- **Authentication**: JWT with Google OAuth support
- **UI Components**: Material Design 3
- **Backend Integration**: RESTful API with existing Node.js backend

## Project Structure

```
lib/
├── models/           # Data models matching backend schemas
├── services/         # API services and business logic
├── providers/        # State management providers
├── screens/          # UI screens
│   ├── auth/        # Authentication screens
│   └── dashboard/   # Dashboard screens
├── widgets/          # Reusable UI components
├── utils/           # Utility functions and constants
└── main.dart        # App entry point
```

## Setup Instructions

### Prerequisites
- Flutter SDK 3.0 or higher
- Android Studio / Xcode
- Node.js backend running on localhost:5000

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd urbaneye_mobile
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Configure backend URL**:
   - Update the `baseUrl` in `lib/services/api_service.dart` if your backend is running on a different port or host

4. **Run the app**:
   ```bash
   flutter run
   ```

### Backend Configuration

Make sure your Node.js backend is running and accessible. The app is configured to connect to:
- **Development**: `http://localhost:5000/api`
- **Production**: Update the base URL in `api_service.dart`

### Environment Setup

1. **Android**:
   - Minimum SDK: 21 (Android 5.0)
   - Target SDK: 34 (Android 14)
   - Permissions: Internet, Camera, Location, Storage

2. **iOS**:
   - Minimum iOS: 11.0
   - Permissions: Camera, Location, Photo Library

## API Integration

The app integrates with the following backend endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification

### Future Endpoints (To be implemented)
- `GET /api/complaints` - Get complaints
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint

## Key Features Implementation

### Authentication Flow
1. **Splash Screen**: Checks for existing authentication
2. **Login/Register**: Secure authentication with validation
3. **Email Verification**: Optional email verification flow
4. **Auto-login**: Persistent login with secure token storage

### State Management
- **AuthProvider**: Manages authentication state
- **UserProvider**: Manages user data and profile
- **ComplaintProvider**: Manages complaint data (future)

### UI/UX Design
- **Material Design 3**: Modern, accessible design
- **Responsive Layout**: Works on all screen sizes
- **Dark/Light Theme**: System theme support
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

## Development Guidelines

### Code Style
- Follow Flutter/Dart conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep widgets small and focused

### State Management
- Use Provider for global state
- Keep local state in StatefulWidget when appropriate
- Avoid prop drilling

### API Integration
- Always handle errors gracefully
- Show loading states during API calls
- Implement proper error messages
- Use proper HTTP status codes

## Testing

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter test integration_test/
```

## Building for Production

### Android
```bash
flutter build apk --release
# or
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**:
   - Ensure backend is running on correct port
   - Check network connectivity
   - Verify API endpoints

2. **Authentication Issues**:
   - Check JWT token validity
   - Verify user credentials
   - Clear app data if needed

3. **Build Issues**:
   - Run `flutter clean`
   - Run `flutter pub get`
   - Check Flutter version compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the UrbanEye MCA project and follows the same licensing terms.

## Support

For support and questions, please contact the development team or create an issue in the project repository.
