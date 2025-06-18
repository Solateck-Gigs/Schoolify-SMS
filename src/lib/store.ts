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
} | null;

type AuthState = {
  user: User;
  isLoading: boolean;
  error: string | null;
  login: (userIdNumber: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (userIdNumber: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { 
        user_id_number: userIdNumber, 
        password 
      });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, isLoading: false });
    } catch (err: any) {
      localStorage.removeItem('token');
      set({ 
        error: err.response?.data?.error || 'Login failed', 
        isLoading: false, 
        user: null 
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      set({ user, isLoading: false });
    } catch (err) {
      localStorage.removeItem('token');
      set({ user: null, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, error: null, isLoading: false });
  },
}));