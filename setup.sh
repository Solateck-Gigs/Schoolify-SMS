#!/bin/bash

# Schoolify Setup Script
# This script helps you set up the Schoolify School Management System

echo "🏫 Welcome to Schoolify Setup!"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 16
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            print_warning "Node.js version 16 or higher is recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if MongoDB is installed or running
check_mongodb() {
    if command -v mongod &> /dev/null; then
        print_status "MongoDB is installed"
    elif command -v docker &> /dev/null; then
        print_info "MongoDB not found locally, but Docker is available for containerized setup"
    else
        print_warning "MongoDB not found. You can:"
        echo "  1. Install MongoDB locally"
        echo "  2. Use MongoDB Atlas (cloud)"
        echo "  3. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    fi
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    cd schoolify-server || {
        print_error "Backend directory not found!"
        exit 1
    }
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating backend .env file..."
        cat > .env << EOL
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/schoolify

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=1d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
EOL
        print_status "Backend .env file created with secure JWT secret"
    else
        print_warning "Backend .env file already exists, skipping creation"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating frontend .env file..."
        cat > .env << EOL
# Frontend Environment Variables
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Schoolify
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
EOL
        print_status "Frontend .env file created"
    else
        print_warning "Frontend .env file already exists, skipping creation"
    fi
}

# Start MongoDB with Docker if needed
setup_mongodb_docker() {
    if command -v docker &> /dev/null; then
        read -p "Would you like to start MongoDB using Docker? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Starting MongoDB with Docker..."
            docker run -d -p 27017:27017 --name schoolify-mongodb mongo:latest
            print_status "MongoDB started in Docker container 'schoolify-mongodb'"
        fi
    fi
}

# Main setup process
main() {
    echo
    print_info "Starting Schoolify setup process..."
    echo
    
    # Check prerequisites
    print_info "Checking prerequisites..."
    check_node
    check_mongodb
    echo
    
    # Setup MongoDB if needed
    setup_mongodb_docker
    echo
    
    # Setup backend
    setup_backend
    echo
    
    # Setup frontend
    setup_frontend
    echo
    
    # Final instructions
    print_status "Setup completed successfully! 🎉"
    echo
    echo "📋 Next steps:"
    echo "1. Start the backend server:"
    echo "   cd schoolify-server && npm run dev"
    echo
    echo "2. In a new terminal, start the frontend:"
    echo "   npm start"
    echo
    echo "3. Open your browser and visit:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo
    echo "📚 For detailed documentation, check:"
    echo "   - Main README: ./README.md"
    echo "   - Backend README: ./schoolify-server/README.md"
    echo
    print_status "Happy coding! 🚀"
}

# Run main function
main 