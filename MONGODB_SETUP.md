# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended - Free Cloud Database)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)

### Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose "FREE" tier
3. Select a cloud provider (AWS/Google Cloud/Azure)
4. Choose a region close to you
5. Click "Create"

### Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### Step 4: Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string

### Step 6: Update Your Config
Replace the connection string in `server/config.env`:
```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/urbaneye?retryWrites=true&w=majority
```

Replace:
- `your_username` with your database username
- `your_password` with your database password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL

## Option 2: Local MongoDB Installation

### Windows Installation
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB Compass (GUI tool) if prompted
5. Start MongoDB service:
   ```bash
   # Open Command Prompt as Administrator
   net start MongoDB
   ```

### Update Config for Local MongoDB
In `server/config.env`:
```env
MONGODB_URI=mongodb://localhost:27017/urbaneye
```

## Test Connection
After setting up either option, restart your server:
```bash
npm run server
```

You should see: "MongoDB Connected Successfully!"
