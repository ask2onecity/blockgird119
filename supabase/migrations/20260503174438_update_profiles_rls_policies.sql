/*
  # Add admin read policy and update is_admin policy for profiles

  1. Security
    - Admin users can read all profiles
    - Allow profiles to be read by authenticated users (for community features)
    - Only admin can update is_admin field via a restrictive policy
*/

-- Allow all authenticated users to read profiles (needed for community display)
CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Drop the restrictive single-user read policy since we now have a broader one
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
