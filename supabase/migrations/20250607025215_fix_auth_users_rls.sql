-- Ensure RLS is enabled on the auth.users table (usually enabled by default, but good to be sure)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict with selecting user data
DROP POLICY IF EXISTS "Allow authenticated user to select own data" ON auth.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON auth.users;

-- Create a policy allowing authenticated users to select their own data
CREATE POLICY "Allow authenticated user to select own data"
ON auth.users FOR SELECT
TO authenticated  -- Apply this policy to all authenticated users
USING (id = auth.uid()); -- Allow selecting rows where the user id matches the authenticated user's id 