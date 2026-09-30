/*
  # Replace admin_roles RLS policies with profiles.is_admin

  1. Security Changes
    - Replace all RLS policies that reference admin_roles with profiles.is_admin checks
    - Affects tables: admin_audit_log, membership_tiers
    - Admin access is now determined by profiles.is_admin = true instead of admin_roles table

  2. Tables affected
    - admin_audit_log: SELECT, INSERT policies
    - membership_tiers: admin SELECT, INSERT, UPDATE policies
*/

-- === admin_audit_log ===
DROP POLICY IF EXISTS "Admins can read audit log" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit log entries" ON admin_audit_log;

CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert audit log entries"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- === membership_tiers ===
DROP POLICY IF EXISTS "Admins can read all tiers" ON membership_tiers;
DROP POLICY IF EXISTS "Super admins can insert tiers" ON membership_tiers;
DROP POLICY IF EXISTS "Super admins can update tiers" ON membership_tiers;

CREATE POLICY "Admins can read all tiers"
  ON membership_tiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert tiers"
  ON membership_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update tiers"
  ON membership_tiers FOR UPDATE
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
