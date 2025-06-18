# 🚀 Schoolify Setup Guide

This guide will help you set up the Schoolify School Management System on your local machine.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** - Choose one option:
  - Local installation - [Download here](https://www.mongodb.com/try/download/community)
  - MongoDB Atlas (cloud) - [Sign up here](https://www.mongodb.com/atlas)
  - Docker - [Download here](https://www.docker.com/get-started)
- **Git** - [Download here](https://git-scm.com/)

## 🔧 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/schoolify.git
cd schoolify
```

### 2. Set Up MongoDB

Choose one of the following options:

#### Option A: Local MongoDB
```bash
# Install MongoDB and start the service
# On macOS with Homebrew:
brew install mongodb-community
brew services start mongodb-community

# On Windows: Download and install from MongoDB website
# On Linux: Follow MongoDB installation guide for your distribution
```

#### Option B: MongoDB with Docker
```bash
docker run -d -p 27017:27017 --name schoolify-mongodb mongo:latest
```

#### Option C: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string (you'll need this for the backend .env file)

### 3. Set Up Backend

```bash
# Navigate to backend directory
cd schoolify-server

# Install dependencies
npm install

# Create environment file
# For Windows PowerShell:
Copy-Item .env.example .env

# For macOS/Linux:
cp .env.example .env
```

#### Edit Backend .env File

Open `schoolify-server/.env` and configure:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (choose one)
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/schoolify

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/schoolify

# For Docker MongoDB:
# MONGODB_URI=mongodb://localhost:27017/schoolify

# JWT Configuration (generate a secure secret)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random
JWT_EXPIRES_IN=1d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

**Important**: Generate a secure JWT secret:
- Online generator: [Generate JWT Secret](https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx)
- Or use Node.js: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4. Set Up Frontend

```bash
# Navigate back to root directory
cd ..

# Install frontend dependencies
npm install

# Create environment file
# For Windows PowerShell:
Copy-Item .env.example .env

# For macOS/Linux:
cp .env.example .env
```

#### Edit Frontend .env File

Open `.env` in the root directory and configure:

```env
# Frontend Environment Variables
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Schoolify
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

### 5. Start the Application

#### For Windows PowerShell Users:

Since `&&` doesn't work in PowerShell, use separate commands:

**Terminal 1 - Start Backend:**
```powershell
cd schoolify-server
npm run dev
```

**Terminal 2 - Start Frontend:**
```powershell
# Open a new terminal window
cd C:\Users\YourUsername\Path\To\schoolify
npm start
```

#### For macOS/Linux/Git Bash Users:

**Terminal 1 - Start Backend:**
```bash
cd schoolify-server && npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health (if available)

## 🎯 Quick Commands Reference

### Backend Commands
```bash
cd schoolify-server
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Check code quality
```

### Frontend Commands
```bash
npm install          # Install dependencies
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Check code quality
```

## 🔍 Verification Steps

### 1. Check if Backend is Running
Visit: http://localhost:5000

You should see a response like:
```json
{
  "message": "Schoolify Backend is running!"
}
```

### 2. Check if Frontend is Running
Visit: http://localhost:3000

You should see the Schoolify login page.

### 3. Check Database Connection
Check your backend terminal for messages like:
```
Connected to MongoDB
Server running on port 5000
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :5000
lsof -i :3000

# Kill the process using the port
# Windows:
taskkill /PID <PID> /F

# macOS/Linux:
kill -9 <PID>
```

#### 2. MongoDB Connection Issues
```bash
# Check if MongoDB is running
# Local MongoDB:
mongosh

# Docker MongoDB:
docker ps | grep mongo

# If using Docker and container stopped:
docker start schoolify-mongodb
```

#### 3. Node.js Version Issues
```bash
# Check Node.js version
node --version

# Should be v16 or higher
# If not, update Node.js from nodejs.org
```

#### 4. Environment Variables Not Loading
- Make sure `.env` files are in the correct directories
- Restart both servers after changing `.env` files
- Check for typos in variable names

#### 5. CORS Issues
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that `REACT_APP_API_BASE_URL` in frontend `.env` is correct

### Reset Everything
If you encounter persistent issues:

```bash
# Stop all servers (Ctrl+C in terminals)

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf schoolify-server/node_modules schoolify-server/package-lock.json

# Reinstall dependencies
npm install
cd schoolify-server && npm install

# Restart MongoDB if using Docker
docker restart schoolify-mongodb

# Start servers again
```

## 📚 Next Steps

After successful setup:

1. **Explore the Application**: Navigate through different user roles
2. **Read Documentation**: Check the main README.md for features
3. **API Documentation**: Review the backend README for API endpoints
4. **Customize**: Modify the application to fit your needs

## 🆘 Getting Help

If you encounter issues:

1. **Check Console Logs**: Look for error messages in browser dev tools and terminal
2. **Verify Environment Variables**: Double-check all `.env` configurations
3. **Check Network**: Ensure no firewall blocking localhost connections
4. **Review Prerequisites**: Confirm all required software is installed

For additional support:
- 📧 Email: support@schoolify.com
- 💬 Discord: [Join our community](https://discord.gg/schoolify)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/schoolify/issues)

---

**Cheers! 🚀**