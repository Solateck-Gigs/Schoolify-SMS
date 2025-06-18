# 🎨 Schoolify Frontend

React TypeScript frontend for the Schoolify School Management System.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Features](#features)
- [Authentication](#authentication)
- [Routing](#routing)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [UI Components](#ui-components)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

The Schoolify frontend is a modern React application built with TypeScript, featuring a responsive design and role-based access control. It provides intuitive interfaces for different user roles including Super Admin, Admin, Teacher, Student, and Parent.

## 🛠️ Tech Stack

- **React 18** - Modern React with Hooks and Concurrent Features
- **TypeScript** - Type-safe JavaScript development
- **Material-UI (MUI)** - Comprehensive React component library
- **Zustand** - Lightweight state management
- **React Router v6** - Declarative routing
- **Axios** - Promise-based HTTP client
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Modern icon library
- **Vite** - Fast build tool and dev server

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v7.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** for version control

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/schoolify.git
cd schoolify
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
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Schoolify
REACT_APP_VERSION=1.0.0
```

### 4. Start Development Server
```bash
npm start
# or
yarn start
```

The application will open at `http://localhost:3000`

## 🔧 Development

### Development Server
```bash
npm start          # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking
```

### Code Quality
```bash
npm run lint:fix   # Fix ESLint issues
npm run format     # Format code with Prettier
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

## 📁 Project Structure

```
src/
├── 📁 components/          # Reusable UI components
│   ├── 📁 ui/             # Basic UI components (Button, Input, etc.)
│   ├── 📁 layout/         # Layout components (Header, Sidebar, etc.)
│   └── 📁 forms/          # Form components
├── 📁 pages/              # Page components
│   ├── 📁 Auth/           # Authentication pages
│   ├── 📁 Dashboard/      # Dashboard pages
│   ├── 📁 Student/        # Student-related pages
│   ├── 📁 Teachers/       # Teacher-related pages
│   └── 📁 Admin/          # Admin pages
├── 📁 lib/                # Utilities and configurations
│   ├── 📄 store.ts        # Zustand store configuration
│   ├── 📄 jwt.ts          # JWT utility functions
│   └── 📄 utils.ts        # General utility functions
├── 📁 services/           # API service functions
│   └── 📄 api.ts          # Axios configuration and interceptors
├── 📁 types/              # TypeScript type definitions
│   ├── 📄 auth.ts         # Authentication types
│   ├── 📄 user.ts         # User-related types
│   └── 📄 api.ts          # API response types
├── 📁 hooks/              # Custom React hooks
├── 📁 assets/             # Static assets (images, icons, etc.)
├── 📁 styles/             # Global styles and themes
├── 📄 App.tsx             # Main App component
├── 📄 main.tsx            # Application entry point
└── 📄 vite-env.d.ts       # Vite type definitions
```

## 🌍 Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api

# Application Configuration
REACT_APP_APP_NAME=Schoolify
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development

# Optional: Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
```

## 📜 Available Scripts

### Development
- `npm start` - Start development server with hot reloading
- `npm run dev` - Alternative command for development server

### Building
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code using Prettier
- `npm run type-check` - Run TypeScript compiler for type checking

### Testing
- `npm test` - Run tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## ✨ Features

### 🔐 Authentication System
- **JWT Token Management** - Secure token storage and validation
- **Role-based Access** - Different interfaces for different user roles
- **Profile Completion** - Step-by-step profile setup
- **Password Reset** - Secure password recovery flow
- **Session Persistence** - Maintain login state across browser sessions

### 📱 Responsive Design
- **Mobile-first Approach** - Optimized for mobile devices
- **Tablet Support** - Adapted layouts for tablet screens
- **Desktop Experience** - Full-featured desktop interface
- **Cross-browser Compatibility** - Works on all modern browsers

### 🎨 User Interface
- **Material Design** - Clean, modern interface following Material Design principles
- **Dark/Light Theme** - User preference-based theme switching
- **Accessibility** - WCAG 2.1 compliant interface
- **Internationalization** - Multi-language support ready

### 📊 Dashboard Features
- **Role-specific Dashboards** - Customized dashboards for each user role
- **Real-time Data** - Live updates and notifications
- **Interactive Charts** - Data visualization with charts and graphs
- **Quick Actions** - Easy access to frequently used features

## 🔐 Authentication

### JWT Token Management
The application uses a sophisticated JWT token management system:

```typescript
// JWT utility functions in src/lib/jwt.ts
export const decodeJWT = (token: string): JWTPayload | null => {
  // Decode JWT token client-side
};

export const isTokenExpired = (token: string): boolean => {
  // Check if token is expired
};

export const getUserFromToken = (token: string): { id: string; role: string } | null => {
  // Extract user info from token
};
```

### Auth Store (Zustand)
```typescript
// State management in src/lib/store.ts
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  getCurrentUserId: () => {
    // Get user ID from JWT token
  },
  checkAuth: async () => {
    // Validate authentication and load user data
  },
  login: async (userIdNumber: string, password: string) => {
    // Handle user login
  },
  logout: () => {
    // Handle user logout
  }
}));
```

## 🛣️ Routing

The application uses React Router v6 for navigation:

```typescript
// Main routing structure in App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  
  {/* Protected Routes */}
  <Route element={<PrivateRoute />}>
    <Route element={<Layout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/teachers" element={<TeachersPage />} />
      <Route path="/classes" element={<ClassesPage />} />
      {/* More protected routes... */}
    </Route>
  </Route>
</Routes>
```

### Route Protection
Routes are protected based on user authentication and roles:

```typescript
// PrivateRoute component
const PrivateRoute = () => {
  const { user, isLoading, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return <Outlet />;
};
```

## 🗃️ State Management

### Zustand Store Structure
```typescript
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  isProfileComplete: boolean;
  
  // Actions
  login: (userIdNumber: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  getCurrentUserId: () => string | null;
}
```

### Usage in Components
```typescript
const MyComponent = () => {
  const { user, login, logout, getCurrentUserId } = useAuthStore();
  
  const handleLogin = async () => {
    try {
      await login(userIdNumber, password);
      // Handle successful login
    } catch (error) {
      // Handle login error
    }
  };
  
  return (
    // Component JSX
  );
};
```

## 🔌 API Integration

### Axios Configuration
```typescript
// API service in src/services/api.ts
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API Usage Examples
```typescript
// Fetch students data
const fetchStudents = async () => {
  try {
    const response = await api.get('/admin/students');
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// Create new student
const createStudent = async (studentData: StudentData) => {
  try {
    const response = await api.post('/students', studentData);
    return response.data;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};
```

## 🎨 UI Components

### Material-UI Customization
```typescript
// Theme configuration
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

### Custom Components
```typescript
// Example: Custom Button component
interface CustomButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  children,
  onClick,
}) => {
  return (
    <Button
      variant={variant === 'outline' ? 'outlined' : 'contained'}
      color={variant === 'secondary' ? 'secondary' : 'primary'}
      size={size}
      disabled={loading}
      onClick={onClick}
      startIcon={loading ? <CircularProgress size={16} /> : undefined}
    >
      {children}
    </Button>
  );
};
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables for Production
```env
REACT_APP_API_BASE_URL=https://your-api-domain.com/api
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_DEBUG=false
```

## 🔧 Troubleshooting

### Common Issues

#### 1. API Connection Issues
```bash
# Check if backend is running
curl http://localhost:5000/api

# Verify environment variables
echo $REACT_APP_API_BASE_URL
```

#### 2. Authentication Problems
```typescript
// Clear localStorage and retry
localStorage.clear();
window.location.reload();
```

#### 3. Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. TypeScript Errors
```bash
# Run type checking
npm run type-check

# Fix common TypeScript issues
npm run lint:fix
```

### Performance Optimization

#### 1. Code Splitting
```typescript
// Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Use with Suspense
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

#### 2. Bundle Analysis
```bash
npm run build
npm run analyze
```

## 📞 Support

If you encounter any issues:

1. **Check Console Errors** - Open browser dev tools and check for errors
2. **Verify Environment Variables** - Ensure all required env vars are set
3. **Check Network Tab** - Verify API calls are being made correctly
4. **Clear Browser Cache** - Sometimes cached data causes issues
5. **Check Backend Status** - Ensure the backend server is running

For additional help:
- 📧 Email: frontend-support@schoolify.com
- 💬 Discord: [Join our community](https://discord.gg/schoolify)
- 📖 Documentation: [Full docs](https://docs.schoolify.com)

---

**Happy coding! 🚀** 