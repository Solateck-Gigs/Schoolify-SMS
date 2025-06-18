# 🏫 Schoolify - School Management System

A comprehensive school management system built with React (TypeScript) frontend and Node.js/Express backend with MongoDB database.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🎯 **Core Functionality**
- **Multi-role Authentication**: Super Admin, Admin, Teacher, Student, Parent
- **Dynamic Dashboard**: Role-based personalized dashboards
- **Student Management**: Complete CRUD operations for student records
- **Teacher Management**: Staff management with profile completion
- **Class Management**: Classroom organization and assignment
- **Fee Management**: Financial tracking and payment status
- **Attendance Tracking**: Daily attendance monitoring
- **Performance Analytics**: Academic performance insights
- **Real-time Notifications**: System announcements and messaging

### 🔐 **Advanced Features**
- **JWT Token Authentication** with client-side decoding
- **Role-based Access Control** (RBAC)
- **Page Refresh Persistence** - No logout on refresh
- **Dynamic API Endpoints** using user ID from JWT
- **Responsive Design** - Mobile-first approach
- **Real-time Updates** with optimistic UI updates
- **Data Export/Import** capabilities
- **Advanced Search & Filtering**

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Material-UI (MUI)** for component library
- **Zustand** for state management
- **React Router v6** for navigation
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Lucide React** for icons

### **Backend**
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests
- **dotenv** for environment variables

## 📁 Project Structure

```
schoolify/
├── 📁 frontend/                 # React TypeScript frontend
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI components
│   │   ├── 📁 pages/           # Page components
│   │   ├── 📁 lib/             # Utilities and stores
│   │   ├── 📁 services/        # API services
│   │   └── 📁 types/           # TypeScript type definitions
│   ├── 📄 package.json
│   └── 📄 README.md
├── 📁 schoolify-server/        # Node.js backend
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Route controllers
│   │   ├── 📁 models/          # MongoDB models
│   │   ├── 📁 routes/          # API routes
│   │   ├── 📁 middleware/      # Custom middleware
│   │   └── 📁 types/           # TypeScript types
│   ├── 📄 package.json
│   └── 📄 README.md
└── 📄 README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/schoolify.git
cd schoolify
```

### 2. Backend Setup
```bash
cd schoolify-server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd ../
npm install
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔧 Development Setup

For detailed setup instructions, see:
- [Frontend Setup Guide](./README.md#frontend-setup)
- [Backend Setup Guide](./schoolify-server/README.md#backend-setup)

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/complete-profile  # Complete user profile
```

### User Management
```
GET    /api/users/:id       # Get user by ID (dynamic)
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user
```

### Admin Endpoints
```
GET /api/admin/students     # Get all students
GET /api/admin/teachers     # Get all teachers
GET /api/admin/classes      # Get all classes
GET /api/admin/fees         # Get all fees
```

For complete API documentation, see [Backend README](./schoolify-server/README.md).

## 🎭 User Roles & Permissions

### 👑 **Super Admin**
- Full system access
- User management (CRUD)
- System configuration
- Data export/import

### 🛡️ **Admin**
- Student & teacher management
- Class management
- Fee management
- Reports and analytics

### 👨‍🏫 **Teacher**
- View assigned classes
- Mark attendance
- Grade management
- Student performance tracking

### 🎓 **Student**
- View personal dashboard
- Check grades and attendance
- Access class materials
- View announcements

### 👨‍👩‍👧‍👦 **Parent**
- View child's progress
- Communication with teachers
- Fee payment status
- Attendance monitoring

## 🔐 Authentication Flow

1. **Registration**: User registers with basic info
2. **Profile Completion**: Role-specific profile completion
3. **JWT Token**: Secure token-based authentication
4. **Dynamic Access**: Role-based route and feature access
5. **Persistence**: Token persists across page refreshes

## 🌟 Key Features Explained

### Dynamic Authentication
- JWT tokens decoded client-side
- User ID extracted from token for API calls
- No dependency on `/auth/me` endpoint
- Automatic token expiration handling

### Role-Based Access Control
- Different dashboards per role
- Feature visibility based on permissions
- API endpoint authorization
- Secure data access patterns

### Page Refresh Persistence
- Authentication state maintained
- No logout on page refresh
- Seamless user experience
- Token validation on app load

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend Deployment
```bash
npm run build
npm start
# Deploy to your server or cloud platform
```

### Environment Variables
See respective README files for required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/schoolify/issues) page
2. Create a new issue with detailed description
3. Join our [Discord community](https://discord.gg/your-invite)
4. Email: support@schoolify.com

## 🙏 Acknowledgments

- React and TypeScript communities
- Material-UI team
- MongoDB and Mongoose teams
- All contributors and testers

---

**Made with ❤️ by the Schoolify Team** 