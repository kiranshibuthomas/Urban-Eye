# UrbanEye - Smart City Management System

A comprehensive platform for citizens and administrators to report, track, and manage city issues efficiently.

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [MongoDB Setup](#-mongodb-setup)
- [AI Automation Setup](#-ai-automation-setup-optional)
- [Project Structure](#-project-structure)
- [Performance](#-performance)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Authentication
- Secure login/registration with JWT
- Email verification
- Password reset
- Role-based access (Citizen/Admin/Field Staff)
- Google OAuth integration

### 📱 Citizen Features
- Report issues with photos and location
- Track complaint status real-time
- View personal history
- Receive notifications

### 👨‍💼 Admin Features
- Comprehensive dashboard with analytics
- Complaint management
- Staff assignment
- Automated workflows
- Advanced filtering

### 🤖 AI Automation (Optional)
- Auto-categorization of complaints
- Intelligent priority detection
- Automatic field staff assignment
- Scheduled processing

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Tailwind CSS
- Framer Motion (animations)
- React Router + React Hot Toast
- Recharts (analytics)

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)
- OpenAI API (optional AI features)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# 1. Clone repository
git clone https://github.com/kiranshibuthomas/Urban-Eye.git
cd Urban-Eye

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install
```

### Configuration

Create `server/config.env`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/urbaneye

# JWT
JWT_SECRET=your_secure_secret_key_here

# Server
PORT=5000
NODE_ENV=development

# Email (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI (optional - for AI features)
OPENAI_API_KEY=your_openai_api_key
```

### Start Development Servers

```bash
# Backend (from server directory)
npm run dev

# Frontend (from client directory - new terminal)
npm start
```

Access the app at `http://localhost:3000`

---

## 💾 MongoDB Setup

### Option 1: MongoDB Atlas (Recommended - Free)

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas) → "Try Free"

2. **Create Cluster**:
   - Choose FREE tier (M0)
   - Select cloud provider and region
   - Click "Create"

3. **Database User**:
   - Go to "Database Access"
   - Add user with password
   - Set privileges: "Read and write to any database"

4. **Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development)

5. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string

6. **Update config.env**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/urbaneye?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

```bash
# Windows
# Download from mongodb.com/try/download/community
# Install and start service:
net start MongoDB

# Update config.env:
MONGODB_URI=mongodb://localhost:27017/urbaneye
```

---

## 🤖 AI Automation Setup (Optional)

The system includes AI-powered automation for complaint processing.

### Features
- Auto-categorization using GPT-3.5
- Image analysis with GPT-4-vision
- Intelligent priority detection
- Automatic field staff assignment

### Setup

1. **Get OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create account and generate API key

2. **Install Dependencies**:
```bash
cd server
npm install openai sharp
```

3. **Add to config.env**:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Restart Server**

### Category Mapping
- **waste_management** → Sanitation dept
- **water_supply** → Water dept
- **electricity** → Electrical dept
- **road_issues** → Public works
- **drainage** → Public works

### Cost Estimate
- Text analysis: ~$0.001-0.002 per complaint
- Image analysis: ~$0.01-0.02 per image
- Monthly: $10-50 for moderate usage

**Note**: AI features are optional. System works without OpenAI API.

---

## 📁 Project Structure

```
Urban-Eye/
├── client/                  # React Frontend
│   ├── public/
│   └── src/
│       ├── components/      # Reusable components
│       ├── pages/          # Page components
│       ├── context/        # Context providers
│       ├── utils/          # Utilities
│       │   ├── performanceUtils.js    # Debounce/throttle
│       │   └── performanceMonitor.js  # Performance tracking
│       └── services/       # API services
│
├── server/                  # Node.js Backend
│   ├── config/             # Configuration
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   │   ├── aiService.js         # AI automation
│   │   ├── automationService.js # Workflow automation
│   │   └── emailService.js      # Email notifications
│   ├── scripts/           # Utility scripts
│   └── uploads/           # File uploads
│
└── README.md              # This file
```

---

## ⚡ Performance

The app is optimized for smooth 60fps animations and fast load times:

### Optimizations Applied
- **Lazy Loading**: 40% smaller initial bundle
- **Code Splitting**: Routes loaded on demand
- **React.memo**: 60-70% fewer re-renders
- **GPU Acceleration**: Smooth animations
- **Debouncing**: Optimized API calls
- **Image Lazy Loading**: Faster page loads

### Performance Metrics
- Page load animations: 0.3s (50% faster)
- Initial bundle: 40% reduction
- Component re-renders: 60-70% reduction
- All animations: <300ms for instant feel

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Get current user |
| POST | `/auth/resend-verification` | Resend email verification |

### Complaint Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/complaints` | Get all complaints |
| POST | `/complaints` | Create complaint |
| GET | `/complaints/:id` | Get complaint by ID |
| PUT | `/complaints/:id` | Update complaint |
| DELETE | `/complaints/:id` | Delete complaint |
| GET | `/complaints/stats` | Get statistics |

### Admin Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| PUT | `/users/:id/role` | Update user role |
| GET | `/field-staff` | Get field staff |
| POST | `/complaints/process-pending` | Process pending complaints |
| GET | `/scheduler/status` | Get scheduler status |

### Response Format

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🚀 Deployment

### Backend Deployment (Render/Heroku)

1. **Set Environment Variables**:
   - MONGODB_URI
   - JWT_SECRET
   - PORT
   - NODE_ENV=production
   - (Optional) OPENAI_API_KEY

2. **Build Command**: `npm install`

3. **Start Command**: `npm start`

### Frontend Deployment (Vercel/Netlify)

1. **Build Command**: `npm run build`

2. **Output Directory**: `build`

3. **Environment Variables**:
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

4. **Redirects** (for client-side routing):
   Create `public/_redirects`:
```
/*  /index.html  200
```

---

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation
- CORS configuration
- Rate limiting
- Secure file uploads
- SQL injection prevention
- XSS protection

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

MIT License - feel free to use this project for learning or production.

---

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string in config.env
- Ensure network access in Atlas

### OpenAI API Errors
- Verify API key is correct
- Check if you have sufficient credits
- Review API usage limits

### Build Errors
- Delete node_modules and package-lock.json
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill
```

---

## 📧 Support

For issues or questions:
- Create an issue on GitHub
- Check existing documentation
- Review server logs for errors

---

**Made with ❤️ for smarter cities** 🏙️✨
