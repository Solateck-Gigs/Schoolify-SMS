import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Env Vars:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
}

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data?.role;
}

export async function customLogin(userIdNumber: string, password: string) {
  console.log('Attempting login with userIdNumber:', userIdNumber);
  
  // Step 1: Query the profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, password, role, first_name, last_name, profile_image')
    .eq('user_id_number', userIdNumber)
    .single();

  console.log('Query result:', { profile, error });

  if (error || !profile) {
    throw new Error('Invalid ID number: ' + (error?.message || 'No profile found'));
  }

  // Step 2: Validate the password
  console.log('Comparing password with hashed:', profile.password);
  const isPasswordValid = await bcrypt.compare(password, profile.password);
  console.log('Password valid:', isPasswordValid);

  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  // Step 3: Authenticate with Supabase Auth using the correct email
  const email = 'schoolifymanagementsystem@gmail.com'; // Use the correct email
  console.log('Signing in with Supabase Auth for email:', email);
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  console.log('Auth response:', { session, authError });

  if (authError || !session) {
    throw new Error('Failed to create session: ' + JSON.stringify(authError));
  }

  // Return user details including additional profile info
  return {
    user: {
      id: profile.id,
      role: profile.role,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      profileImage: profile.profile_image || ''
    },
    session
  };
}

export async function changePassword(userId: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from('profiles')
    .update({ password: hashedPassword })
    .eq('id', userId);

  if (error) {
    throw new Error('Failed to update password');
  }
}