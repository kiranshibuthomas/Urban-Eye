# UrbanEye - Smart City Complaint Management System

A comprehensive MERN stack web application for managing urban complaints with role-based authentication, Google OAuth integration, and modern UI/UX.

## 🚀 Features

### Authentication & Authorization
- **JWT-based authentication** with secure session management
- **Google OAuth 2.0** integration for seamless sign-in/sign-up
- **Role-based access control** (Citizen/Admin)
- **Password hashing** with bcrypt for security
- **Remember Me** functionality for extended sessions

### User Roles

#### 👤 Citizen Features
- Submit complaints with photos and priority levels
- View personal complaint history
- Track complaint status (Pending, In Progress, Resolved)
- Receive alerts and notifications

#### 👨‍💼 Admin Features
- View and manage all complaints system-wide
- Assign tasks to staff members
- Send emergency alerts to citizens
- Manage staff accounts and permissions
- Advanced filtering and search capabilities

### Technical Features
- **Responsive design** with Tailwind CSS
- **Smooth animations** powered by Framer Motion
- **Real-time notifications** with React Hot Toast
- **Protected routes** with role-based redirects
- **Modern UI components** with clean, professional design

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

## ⚙️ Installation & Setup

### 1. Navigate to Project Directory
```bash
cd urbaneye
```

### 2. Install Dependencies

#### Install All Dependencies (Recommended)
```bash
npm run install-all
```

#### Or Install Separately
```bash
# Backend dependencies
npm run install-server

# Frontend dependencies
npm run install-client
```

### 3. Backend Setup

#### Environment Configuration
1. Navigate to server folder and copy `config.env` to `.env`:
```bash
cd server
cp config.env .env
```
2. Update the values in `.env`:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/urbaneye

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Google OAuth Configuration (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
CLIENT_URL=http://localhost:3000
```

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 4. Frontend Setup (Optional Configuration)

#### Environment Configuration
Create `client/.env` file for custom API URL:
```bash
cd client
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 5. Database Setup

#### Start MongoDB
- **Local MongoDB**: Ensure MongoDB service is running
- **MongoDB Atlas**: Use the connection string in your `.env` file

The application will automatically create the database and collections on first run.

## 🚀 Running the Application

### Development Mode (Recommended)

#### Start Both Client and Server Concurrently
```bash
# From root directory
npm run dev
```
This will start both the backend server (port 5000) and frontend development server (port 3000) simultaneously.

#### Or Start Separately

#### Start Backend Server Only
```bash
npm run server
```

#### Start Frontend Only
```bash
npm run client
```

### Production Mode

#### Build Frontend
```bash
npm run build
```

#### Start Production Server
```bash
npm start
```

## 📱 Usage

### Accessing the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### Default User Roles
1. **Citizens**: Can register and select "Citizen" role
2. **Admins**: Can register and select "Admin" role

### Testing Google OAuth
1. Click "Sign in with Google" on login/register page
2. Complete Google authentication
3. User will be redirected based on their role

## 🔗 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Protected Routes
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

## 🎨 UI Components

### Pages
- **Login Page** - Email/password and Google sign-in
- **Register Page** - User registration with role selection
- **Citizen Dashboard** - Complaint management for citizens
- **Admin Dashboard** - Administrative controls and oversight

### Features
- **Responsive Design** - Works on all device sizes
- **Dark/Light Theme Support** - Modern color scheme
- **Loading Animations** - Smooth user experience
- **Form Validation** - Client and server-side validation
- **Error Handling** - Comprehensive error management

## 🔐 Security Features

- **JWT Token Security** - Secure authentication tokens
- **Password Hashing** - bcrypt with salt rounds
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Mongoose schema validation
- **Rate Limiting** - (Can be added for production)
- **HTTPS Ready** - Production deployment ready

## 🚦 Project Structure

```
urbaneye/
├── README.md
├── package.json             # Root package.json with scripts
├── client/                  # React frontend
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context (Auth)
│   │   ├── pages/           # Page components
│   │   ├── App.js           # Main app component
│   │   └── index.js         # React entry point
│   └── tailwind.config.js   # Tailwind configuration
└── server/                  # Express backend
    ├── package.json
    ├── server.js            # Express server entry point
    ├── config.env           # Environment variables template
    ├── config/
    │   └── passport.js      # Passport.js configuration
    ├── middleware/
    │   └── auth.js          # Authentication middleware
    ├── models/
    │   └── User.js          # User model
    └── routes/
        └── auth.js          # Authentication routes
```

## 🛡️ Environment Variables

### Required Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Optional Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `JWT_EXPIRE` - JWT expiration time (default: 7d)
- `CLIENT_URL` - Frontend URL (default: http://localhost:3000)

## 🧪 Testing

### Manual Testing
1. Register as a citizen and admin
2. Test Google OAuth flow
3. Test role-based redirects
4. Test protected routes
5. Test logout functionality

### Future Enhancements
- Unit tests with Jest
- Integration tests with Supertest
- E2E tests with Cypress

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)
1. Build the frontend: `cd client && npm run build`
2. Deploy the `build` folder
3. Set environment variables in hosting platform

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set production environment variables
2. Ensure MongoDB Atlas connection
3. Update Google OAuth redirect URIs
4. Deploy with `npm start`

### Docker Deployment (Optional)
Create Dockerfile for containerized deployment.



## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments

## 🔄 Future Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] Mobile app with React Native
- [ ] Advanced analytics dashboard
- [ ] File upload to cloud storage
- [ ] Email notification system
- [ ] Advanced search and filtering
- [ ] Geolocation integration
- [ ] Multi-language support

---

**Built with ❤️ using the MERN stack**
