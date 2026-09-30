/*
  # Update Memberships RLS to use profiles.is_admin

  1. Security Changes
    - Replace admin_roles-based RLS policies on memberships with profiles.is_admin check
    - Users can read/insert their own memberships (wallet_id = auth.uid())
    - Admin users (profiles.is_admin = true) can read/update all memberships
*/

-- Drop old admin policies that reference admin_roles
DROP POLICY IF EXISTS "Admins can read all memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON memberships;

-- New admin read policy using profiles.is_admin
CREATE POLICY "Admins can read all memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- New admin update policy using profiles.is_admin
CREATE POLICY "Admins can update memberships"
  ON memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Also update profiles RLS to allow admin to update is_admin field
-- (currently users can only update their own profile, but admin needs to toggle is_admin)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
