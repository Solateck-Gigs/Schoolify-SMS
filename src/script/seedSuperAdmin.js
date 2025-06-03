import { createClient } from '@supabase/supabase-js';
import { configDotenv } from 'dotenv';

// Load environment variables
configDotenv();

const supabaseUrl = 'https://kzuyuasljwngkmiwcylb.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6dXl1YXNsanduZ2ttaXdjeWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM2MDA3OCwiZXhwIjoyMDYzOTM2MDc4fQ.gMKJUekraq1VfqhoNxK1k0exYycU_E7SqiplFGsZyV4';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables. Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedSuperAdmin() {
  try {
    let existingUser = null;
    try {
      const { data: userData } = await supabase.auth.admin.getUserByEmail('schoolifymanagementsystem@gmail.com');
      existingUser = userData;
    } catch (error) {
      if (error.message.includes('is not a function')) {
        console.log('getUserByEmail not available, falling back to listUsers...');
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        existingUser = users.users.find(user => user.email === 'schoolifymanagementsystem@gmail.com');
      } else {
        throw error;
      }
    }

    if (existingUser) {
      console.log('Super Admin already exists in auth.users:', existingUser.id);
      // Update metadata, verify email, and reset password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: { role: 'super_admin' },
        email_verified: true,
        password: 'SuperAdmin123' // Ensure the password is set correctly
      });
      if (updateError) throw updateError;
      console.log('Updated user metadata, verified email, and reset password:', updatedUser);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: 'schoolifymanagementsystem@gmail.com',
        password: 'SuperAdmin123',
        options: {
          data: { role: 'super_admin' }
        }
      });

      if (error) throw error;

      console.log('Super Admin created in auth.users:', data);

      const { data: verifiedUser, error: verifyError } = await supabase.auth.admin.updateUserById(data.user.id, {
        email_verified: true
      });
      if (verifyError) throw verifyError;
      console.log('User email verified:', verifiedUser);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ id: data.user.id })
        .eq('user_id_number', 'SUPERADMIN001');

      if (profileError) throw profileError;

      console.log('Profiles table updated with auth.users ID');
    }
  } catch (error) {
    console.error('Error seeding Super Admin:', error.message);
  }
}

seedSuperAdmin();