@echo off
REM Schoolify Setup Script for Windows
REM This script helps you set up the Schoolify School Management System on Windows

echo 🏫 Welcome to Schoolify Setup for Windows!
echo ==========================================
echo.

REM Check if Node.js is installed
echo Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
    node --version
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available
    pause
    exit /b 1
) else (
    echo ✅ npm is available
)

echo.
echo Setting up backend...
echo.

REM Setup backend
if not exist "schoolify-server" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

cd schoolify-server

echo Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating backend .env file...
    (
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo MONGODB_URI=mongodb://localhost:27017/schoolify
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
        echo JWT_EXPIRES_IN=1d
        echo.
        echo # CORS Configuration
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
    echo ✅ Backend .env file created
) else (
    echo ⚠️  Backend .env file already exists, skipping creation
)

cd ..

echo.
echo Setting up frontend...
echo.

REM Setup frontend
echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating frontend .env file...
    (
        echo # Frontend Environment Variables
        echo REACT_APP_API_BASE_URL=http://localhost:5000/api
        echo REACT_APP_APP_NAME=Schoolify
        echo REACT_APP_VERSION=1.0.0
        echo REACT_APP_ENVIRONMENT=development
    ) > .env
    echo ✅ Frontend .env file created
) else (
    echo ⚠️  Frontend .env file already exists, skipping creation
)

echo.
echo ✅ Setup completed successfully! 🎉
echo.
echo 📋 Next steps:
echo 1. Start MongoDB:
echo    - Install MongoDB locally, or
echo    - Use MongoDB Atlas (cloud), or
echo    - Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
echo.
echo 2. Start the backend server:
echo    cd schoolify-server
echo    npm run dev
echo.
echo 3. In a new terminal, start the frontend:
echo    npm start
echo.
echo 4. Open your browser and visit:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo.
echo 📚 For detailed documentation, check:
echo    - Main README: ./README.md
echo    - Backend README: ./schoolify-server/README.md
echo.
echo Happy coding! 🚀
echo.
pause 