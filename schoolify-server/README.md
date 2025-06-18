# 🚀 Schoolify Backend

Node.js/Express backend API for the Schoolify School Management System.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

The Schoolify backend is a robust REST API built with Node.js and Express, featuring JWT authentication, role-based access control, and comprehensive school management functionality. It supports multiple user roles and provides secure endpoints for all school operations.

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe JavaScript development
- **MongoDB** - NoSQL document database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management
- **nodemon** - Development server with auto-restart

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v7.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **MongoDB** (v4.4 or higher) - Local installation or MongoDB Atlas
- **Git** for version control

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/schoolify.git
cd schoolify/schoolify-server
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

PORT=5000


```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://smsync:admin%40SMS2025@schoolifydb.7lgadsu.mongodb.net/schoolifyDB?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1d

# CORS Configuration
FRONTEND_URL=http://localhost:5173```

### 4. Set Up MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB locally (macOS with Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### 5. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The server will start at `http://localhost:5000`

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/schoolify
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/schoolify

``` NB Use Atlas ```

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=1d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

## 🔧 Development

### Development Server
```bash
npm run dev         # Start development server with nodemon
npm run build       # Build TypeScript to JavaScript
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript type checking
```

### Database Operations
```bash
npm run db:seed     # Seed database with sample data
npm run db:reset    # Reset database (caution: deletes all data)
npm run db:migrate  # Run database migrations
```

## 📁 Project Structure

```
src/
├── 📁 controllers/         # Route controllers
│   ├── 📄 authController.ts      # Authentication logic
│   ├── 📄 userController.ts      # User management
│   ├── 📄 studentController.ts   # Student operations
│   ├── 📄 teacherController.ts   # Teacher operations
│   └── 📄 adminController.ts     # Admin operations
├── 📁 models/              # Mongoose models
│   ├── 📄 User.ts                # User model
│   ├── 📄 Student.ts             # Student model
│   ├── 📄 Teacher.ts             # Teacher model
│   ├── 📄 Class.ts               # Class model
│   ├── 📄 Parent.ts              # Parent model
│   └── 📄 Fee.ts                 # Fee model
├── 📁 routes/              # Express routes
│   ├── 📄 auth.ts                # Authentication routes
│   ├── 📄 users.ts               # User routes
│   ├── 📄 students.ts            # Student routes
│   ├── 📄 teachers.ts            # Teacher routes
│   ├── 📄 classes.ts             # Class routes
│   ├── 📄 admin.ts               # Admin routes
│   └── 📄 fees.ts                # Fee routes
├── 📁 middleware/          # Custom middleware
│   ├── 📄 auth.ts                # Authentication middleware
│   ├── 📄 validation.ts          # Input validation
│   ├── 📄 errorHandler.ts        # Error handling
│   └── 📄 rateLimiter.ts         # Rate limiting
├── 📁 types/               # TypeScript type definitions
│   ├── 📄 express.ts             # Express type extensions
│   ├── 📄 auth.ts                # Authentication types
│   └── 📄 models.ts              # Model types
├── 📁 utils/               # Utility functions
│   ├── 📄 jwt.ts                 # JWT utilities
│   ├── 📄 validation.ts          # Validation helpers
│   └── 📄 logger.ts              # Logging utilities
├── 📁 config/              # Configuration files
│   ├── 📄 database.ts            # Database configuration
│   └── 📄 cors.ts                # CORS configuration
├── 📁 seeds/               # Database seed files
├── 📁 tests/               # Test files
├── 📄 index.ts             # Application entry point
└── 📄 app.ts               # Express app configuration
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "student",
  "user_id_number": "STU001",
  "phone": "+1234567890"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "user_id_number": "STU001",
  "password": "securePassword123"
}
```

#### Complete Profile
```http
POST /api/auth/complete-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "admissionNumber": "ADM001",
  "dateOfBirth": "2000-01-01",
  "gender": "male",
  "bloodType": "O+",
  "class": "class_id_here",
  "parent": "parent_id_here"
}
```

### User Management Endpoints

#### Get User by ID (Dynamic)
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated Name",
  "phone": "+1234567890"
}
```

### Student Endpoints

#### Get All Students (Admin Only)
```http
GET /api/admin/students
Authorization: Bearer <token>
```

#### Get Student Profile
```http
GET /api/students/profile/:id
Authorization: Bearer <token>
```

#### Get Student Stats
```http
GET /api/students/profile/:id/stats
Authorization: Bearer <token>
```

#### Update Student Profile
```http
PUT /api/students/profile/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "dateOfBirth": "2000-01-01",
  "bloodType": "A+",
  "medicalConditions": ["Asthma"]
}
```

#### Delete Student
```http
DELETE /api/students/profile/:id
Authorization: Bearer <token>
```

### Teacher Endpoints

#### Get All Teachers (Admin Only)
```http
GET /api/admin/teachers
Authorization: Bearer <token>
```

#### Get Teacher Stats
```http
GET /api/teachers/stats
Authorization: Bearer <token>
```

#### Get Teacher Monthly Stats
```http
GET /api/teachers/monthly-stats?months=6
Authorization: Bearer <token>
```

#### Get Teacher Classes
```http
GET /api/teachers/classes
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Student Performance Data
```http
GET /api/admin/students/performance
Authorization: Bearer <token>
```

#### Get Student Attendance Data
```http
GET /api/admin/students/attendance
Authorization: Bearer <token>
```

#### Get All Classes
```http
GET /api/admin/classes
Authorization: Bearer <token>
```

#### Get All Fees
```http
GET /api/admin/fees
Authorization: Bearer <token>
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

## 🔐 Authentication

### JWT Token Structure
```typescript
interface JWTPayload {
  _id: string;           // User ID
  role: string;          // User role
  iat: number;           // Issued at
  exp: number;           // Expires at
}
```

### Role-Based Access Control

#### User Roles
- **super_admin** - Full system access
- **admin** - Administrative access
- **teacher** - Teacher-specific access
- **student** - Student-specific access
- **parent** - Parent-specific access

#### Middleware Usage
```typescript
// Require authentication
router.get('/protected', authenticateToken, handler);

// Require specific role
router.get('/admin-only', authenticateToken, requireRole(['admin', 'super_admin']), handler);

// Multiple roles
router.get('/staff-only', authenticateToken, requireRole(['admin', 'teacher']), handler);
```

## 🗃️ Database Schema

### User Model
```typescript
interface User {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;        // Hashed
  role: 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent';
  user_id_number: string; // Unique identifier
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Student Model
```typescript
interface Student {
  _id: ObjectId;
  user: ObjectId;          // Reference to User
  admissionNumber: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  class?: ObjectId;        // Reference to Class
  parent?: ObjectId;       // Reference to Parent
  bloodType?: string;
  medicalConditions?: string[];
  allergies?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Teacher Model
```typescript
interface Teacher {
  _id: ObjectId;
  user: ObjectId;          // Reference to User
  employeeId: string;
  dateOfHire: Date;
  subjectsTaught: string[];
  assignedClasses: ObjectId[]; // References to Class
  qualifications: string[];
  experienceYears: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Class Model
```typescript
interface Class {
  _id: ObjectId;
  name: string;
  section: string;
  academicYear: string;
  teacher?: ObjectId;      // Reference to Teacher
  students: ObjectId[];    // References to Student
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Database
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (⚠️ Deletes all data)
- `npm run db:backup` - Create database backup
- `npm run db:restore` - Restore database from backup

### Testing
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

### Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/schoolify
JWT_SECRET=your-super-secure-jwt-secret-for-production
FRONTEND_URL=https://your-frontend-domain.com
```

## 🧪 Testing

### Test Structure
```
tests/
├── 📁 unit/            # Unit tests
├── 📁 integration/     # Integration tests
├── 📁 fixtures/        # Test data
└── 📄 setup.ts         # Test setup
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Example
```typescript
// tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Authentication', () => {
  test('POST /api/auth/login - valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        user_id_number: 'TEST001',
        password: 'testpassword'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues
```bash
# Check MongoDB status
mongosh
# or
docker ps | grep mongo

# Check connection string
echo $MONGODB_URI
```

#### 2. JWT Secret Issues
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3. Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# or
netstat -tulpn | grep 5000

# Kill process
kill -9 <PID>
```

#### 4. Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific modules
DEBUG=express:* npm run dev
```

### Health Check Endpoint
```http
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "database": "connected",
  "memory": {
    "used": "50.2 MB",
    "total": "128 MB"
  }
}
```

## 📞 Support

If you encounter any issues:

1. **Check Server Logs** - Review console output for errors
2. **Verify Environment Variables** - Ensure all required env vars are set
3. **Test Database Connection** - Verify MongoDB is running and accessible
4. **Check API Endpoints** - Use Postman or curl to test endpoints
5. **Review Documentation** - Check this README and API docs

For additional help:
- 📧 Email: backend-support@schoolify.com
- 💬 Discord: [Join our community](https://discord.gg/schoolify)
- 📖 Documentation: [Full API docs](https://docs.schoolify.com/api)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/schoolify/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ by the Schoolify Team** 