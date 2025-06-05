// lib/store.ts
import { create } from 'zustand';
import { supabase, customLogin, getCurrentUser } from './supabase'; // Your Supabase client, customLogin, and getCurrentUser function

type User = {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  profileImage?: string; // Make profileImage optional based on your schema
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
      const { user: loggedInUser } = await customLogin(userIdNumber, password); // Call the imported customLogin function
      
      // customLogin should return the full profile, so we can use it directly
      const mappedUser = loggedInUser
        ? {
            id: loggedInUser.id,
            role: loggedInUser.role ?? '',
            firstName: loggedInUser.firstName ?? '',
            lastName: loggedInUser.lastName ?? '',
            profileImage: loggedInUser.profileImage ?? '',
          }
        : null;

      set({ user: mappedUser, isLoading: false });

    } catch (err) {
      console.error('Login error:', err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const authUser = await getCurrentUser(); // Get the basic auth user from session

      if (authUser) {
        // If a user is found in the session, fetch their profile from the database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, role, first_name, last_name, profile_image')
          .eq('id', authUser.id) // Match by the auth user's ID
          .single();

        if (error) {
          console.error('Error fetching profile for session user:', error);
          // If profile fetching fails, maybe clear the session or handle appropriately
           await supabase.auth.signOut();
           set({ user: null, isLoading: false, error: 'Failed to load user profile.' });
           return;
        }

        if (profile) {
          // Map the profile data to your local User type
          const mappedUser = {
            id: profile.id,
            role: profile.role ?? '',
            firstName: profile.first_name ?? '',
            lastName: profile.last_name ?? '',
            profileImage: profile.profile_image ?? '',
          };
          set({ user: mappedUser, isLoading: false, error: null });
        } else {
           // User in session but no matching profile - something is wrong
           console.error('User in session but no profile found.');
           await supabase.auth.signOut(); // Clear the invalid session
           set({ user: null, isLoading: false, error: 'User profile not found.' });
        }

      } else {
        // No user in session
        set({ user: null, isLoading: false, error: null });
      }

    } catch (err) {
      console.error('checkAuth error:', err);
      set({ user: null, isLoading: false, error: 'Authentication check failed.' });
    }
  },

  logout: () => {
    supabase.auth.signOut();
    set({ user: null, error: null });
  },
}));