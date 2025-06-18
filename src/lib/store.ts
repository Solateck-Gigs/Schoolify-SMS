// lib/store.ts
import { create } from 'zustand';
import api from '../services/api';

// User type
export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'parent' | 'student';
  user_id_number: string;
  phone?: string;
  profileImage?: string;
} | null;

type Profile = {
  _id: string;
  user: string;
  // Common fields that might exist in any profile
  [key: string]: any;
} | null;

type AuthState = {
  user: User;
  profile: Profile;
  isLoading: boolean;
  error: string | null;
  isProfileComplete: boolean;
  login: (userIdNumber: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  completeProfile: (profileData: any) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: false,
  error: null,
  isProfileComplete: false,

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ 
        user, 
        isLoading: false,
        isProfileComplete: false,
        profile: null
      });
    } catch (err: any) {
      localStorage.removeItem('token');
      set({ 
        error: err.response?.data?.error || 'Registration failed', 
        isLoading: false, 
        user: null,
        profile: null,
        isProfileComplete: false
      });
      throw err;
    }
  },

  login: async (userIdNumber: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { 
        user_id_number: userIdNumber, 
        password 
      });
      const { token, user, profileComplete, profileData } = response.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ 
        user,
        profile: profileData,
        isProfileComplete: profileComplete,
        isLoading: false 
      });
    } catch (err: any) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      set({ 
        error: err.response?.data?.error || 'Login failed', 
        isLoading: false, 
        user: null,
        profile: null,
        isProfileComplete: false
      });
      throw err;
    }
  },

  completeProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/complete-profile', profileData);
      set({ 
        profile: response.data.profile,
        isProfileComplete: true,
        isLoading: false 
      });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.error || 'Failed to complete profile', 
        isLoading: false 
      });
      throw err;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    if (!token) {
      set({ 
        user: null,
        profile: null,
        isProfileComplete: false,
        isLoading: false 
      });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const { user, profile } = response.data;
      set({ 
        user,
        profile,
        isProfileComplete: !!profile,
        isLoading: false 
      });
    } catch (err) {
      localStorage.removeItem('token');
      set({ 
        user: null,
        profile: null,
        isProfileComplete: false,
        isLoading: false 
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ 
      user: null,
      profile: null,
      isProfileComplete: false,
      error: null,
      isLoading: false 
    });
  },
}));