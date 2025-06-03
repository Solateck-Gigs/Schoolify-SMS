// lib/store.ts
import { create } from 'zustand';
import { supabase, customLogin, getCurrentUser } from './supabase'; // Your Supabase client, customLogin, and getCurrentUser function

type User = {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  profileImage: string;
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
      const { user } = await customLogin(userIdNumber, password); // Call the imported customLogin function
      // Map the returned user to your local User type
      const mappedUser = user
        ? {
            id: (user as any).id,
            role: (user as any).role ?? '',
            firstName: (user as any).firstName ?? '',
            lastName: (user as any).lastName ?? '',
            profileImage: (user as any).profileImage ?? '',
          }
        : null;
      set({ user: mappedUser, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      // Map the returned user to your local User type
      const mappedUser = user
        ? {
            id: (user as any).id,
            role: (user as any).role ?? '',
            firstName: (user as any).firstName ?? '',
            lastName: (user as any).lastName ?? '',
            profileImage: (user as any).profileImage ?? '',
          }
        : null;
      set({ user: mappedUser, isLoading: false });
    } catch (err) {
      set({ user: null, isLoading: false });
    }
  },

  logout: () => {
    supabase.auth.signOut();
    set({ user: null, error: null });
  },
}));