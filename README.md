# UrbanEye - Smart City Management System

A comprehensive smart city management platform with both web and mobile applications for citizens and administrators to report, track, and manage city issues.

## 🏗️ Project Architecture

```
UrbanEye/
├── client/                 # React Web Application
├── server/                 # Node.js/Express Backend
├── UrbanEyeMobile/         # React Native Mobile App
├── shared/                 # Shared Business Logic & Types
└── docs/                   # Documentation
```

## 🚀 Features

### 🔐 Authentication & User Management
- Secure user registration and login
- Role-based access control (Citizen/Admin)
- Email verification system
- Password reset functionality
- JWT token-based authentication

### 📱 Citizen Features
- Report city issues with photos and location
- Track complaint status in real-time
- View personal complaint history
- Receive notifications on updates
- Modern, responsive dashboard

### 👨‍💼 Admin Features
- Comprehensive complaint management
- Staff assignment and tracking
- Analytics and reporting
- Bulk operations
- Advanced filtering and search

### 📊 Dashboard & Analytics
- Real-time statistics
- Interactive charts and graphs
- Performance metrics
- Trend analysis
- Export capabilities

## 🛠️ Tech Stack

### Web Application (client/)
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Mobile Application (UrbanEyeMobile/)
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation** - Screen navigation
- **AsyncStorage** - Local data persistence
- **React Native Elements** - UI components

### Backend (server/)
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Passport.js** - Authentication middleware
- **Multer** - File upload handling

### Shared (shared/)
- **TypeScript** - Shared type definitions
- **Axios** - HTTP client configuration
- **API Services** - Reusable business logic

## 📱 Mobile App Features

### Native Mobile Experience
- Cross-platform (iOS & Android)
- Offline capability
- Push notifications
- Camera integration
- GPS location services
- Native performance

### User Interface
- Modern, intuitive design
- Touch-optimized interactions
- Responsive layouts
- Loading states
- Error handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- React Native CLI (for mobile development)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UrbanEye
   ```

2. **Install dependencies**
   ```bash
   # Install web app dependencies
   cd client && npm install && cd ..
   
   # Install server dependencies
   cd server && npm install && cd ..
   
   # Install mobile app dependencies
   cd UrbanEyeMobile && npm install && cd ..
   ```

3. **Set up environment variables**
   
   Create `.env` files in the respective directories:
   
   **server/.env:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/urbaneye
   JWT_SECRET=your-jwt-secret
   PORT=5000
   ```
   
   **client/.env:**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```
   
   **UrbanEyeMobile/.env:**
   ```env
   API_URL=http://localhost:5000/api
   ```

4. **Start the development servers**

   **Backend:**
   ```bash
   cd server && npm run dev
   ```
   
   **Web App:**
   ```bash
   cd client && npm start
   ```
   
   **Mobile App:**
   ```bash
   cd UrbanEyeMobile
   npx react-native start
   # In another terminal:
   npx react-native run-android  # or run-ios
   ```

## 📁 Project Structure

### Web Application (client/)
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── styles/             # Global styles
```

### Mobile Application (UrbanEyeMobile/)
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── context/            # React Context providers
├── services/           # API services
└── utils/              # Utility functions
```

### Backend (server/)
```
├── config/             # Configuration files
├── middleware/         # Express middleware
├── models/             # MongoDB models
├── routes/             # API routes
├── controllers/        # Route controllers
└── utils/              # Utility functions
```

### Shared (shared/)
```
├── types/              # TypeScript type definitions
├── services/           # Shared API services
└── utils/              # Shared utility functions
```

## 🔧 Development

### Code Style
- ESLint and Prettier for code formatting
- TypeScript for type safety
- Consistent naming conventions
- Component-based architecture

### Testing
- Unit tests with Jest
- Integration tests
- E2E tests with Cypress (web)
- React Native Testing Library (mobile)

### State Management
- React Context for global state
- Local state with useState/useReducer
- Server state with React Query (web)
- AsyncStorage for persistence (mobile)

## 📦 Building for Production

### Web Application
```bash
cd client
npm run build
```

### Mobile Application

**Android:**
```bash
cd UrbanEyeMobile/android
./gradlew assembleRelease
```

**iOS:**
```bash
cd UrbanEyeMobile/ios
xcodebuild -workspace UrbanEyeMobile.xcworkspace -scheme UrbanEyeMobile -configuration Release archive
```

### Backend
```bash
cd server
npm run build
npm start
```

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Helmet.js security headers

## 📊 API Documentation

The API follows RESTful conventions and includes:

- Authentication endpoints
- Complaint management
- User management
- Dashboard statistics
- File uploads
- Notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic authentication
- ✅ Complaint reporting
- ✅ Dashboard views
- ✅ Mobile app foundation

### Phase 2 (Planned)
- 🔄 Advanced analytics
- 🔄 Real-time notifications
- 🔄 Offline functionality
- 🔄 Push notifications

### Phase 3 (Future)
- 📋 AI-powered issue classification
- 📋 Predictive maintenance
- 📋 Integration with city systems
- 📋 Advanced reporting tools

---

**UrbanEye** - Making cities smarter, one issue at a time! 🏙️✨
