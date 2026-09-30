/*
  # Add Admin and Membership System

  1. New Tables
    - `membership_tiers` - Defines membership plans (Bronze, Silver, Gold)
    - `memberships` - Links wallets to their active membership tier
    - `admin_roles` - Stores admin role assignments per wallet
    - `admin_audit_log` - Tracks all admin actions for accountability

  2. Modified Tables
    - `wallets` - Added `membership_tier_id` (FK) and `is_admin` (boolean) columns

  3. Security
    - RLS enabled on all new tables
    - Membership tiers: public read for active tiers, admin full access
    - Memberships: users read own, admins read all and manage
    - Admin roles: users read own, admins read all, super_admin manages
    - Audit log: admins read all, admins insert own actions

  4. Seed Data
    - 3 default tiers: Bronze ($9.99/mo), Silver ($29.99/mo), Gold ($99.99/mo)
*/

-- ============================================
-- Membership Tiers
-- ============================================
CREATE TABLE IF NOT EXISTS membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  price_monthly integer NOT NULL DEFAULT 0,
  price_yearly integer NOT NULL DEFAULT 0,
  max_blocks integer NOT NULL DEFAULT 10,
  max_images integer NOT NULL DEFAULT 5,
  can_custom_image boolean NOT NULL DEFAULT false,
  can_social_links boolean NOT NULL DEFAULT false,
  can_works_showcase boolean NOT NULL DEFAULT false,
  priority_support boolean NOT NULL DEFAULT false,
  badge_color text NOT NULL DEFAULT '#6b7280',
  description text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Memberships
-- ============================================
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES membership_tiers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_wallet_id ON memberships(wallet_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- ============================================
-- Admin Roles
-- ============================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid UNIQUE NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  granted_by uuid REFERENCES wallets(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_wallet_id ON admin_roles(wallet_id);

-- ============================================
-- Admin Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text DEFAULT '',
  target_id text DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_wallet_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);

-- ============================================
-- Add columns to wallets
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'membership_tier_id'
  ) THEN
    ALTER TABLE wallets ADD COLUMN membership_tier_id uuid REFERENCES membership_tiers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE wallets ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================
-- Enable RLS on all new tables
-- ============================================
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: Membership Tiers
-- ============================================

-- Anyone authenticated can read active tiers
CREATE POLICY "Authenticated users can read active tiers"
  ON membership_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can read all tiers (including inactive)
CREATE POLICY "Admins can read all tiers"
  ON membership_tiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

-- Super admins can insert tiers
CREATE POLICY "Super admins can insert tiers"
  ON membership_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role = 'super_admin'
      AND admin_roles.is_active = true
    )
  );

-- Super admins can update tiers
CREATE POLICY "Super admins can update tiers"
  ON membership_tiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role = 'super_admin'
      AND admin_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role = 'super_admin'
      AND admin_roles.is_active = true
    )
  );

-- ============================================
-- RLS Policies: Memberships
-- ============================================

-- Users can read own memberships
CREATE POLICY "Users can read own memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (wallet_id = auth.uid());

-- Admins can read all memberships
CREATE POLICY "Admins can read all memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin', 'moderator')
      AND admin_roles.is_active = true
    )
  );

-- Users can insert own memberships
CREATE POLICY "Users can insert own memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (wallet_id = auth.uid());

-- Admins can update any membership
CREATE POLICY "Admins can update memberships"
  ON memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

-- ============================================
-- RLS Policies: Admin Roles
-- ============================================

-- Users can read their own admin role
CREATE POLICY "Users can read own admin role"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (wallet_id = auth.uid());

-- Admins can read all admin roles
CREATE POLICY "Admins can read all admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.wallet_id = auth.uid()
      AND ar.role IN ('super_admin', 'admin', 'moderator')
      AND ar.is_active = true
    )
  );

-- Super admins can insert admin roles
CREATE POLICY "Super admins can insert admin roles"
  ON admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role = 'super_admin'
      AND admin_roles.is_active = true
    )
  );

-- Super admins can update admin roles
CREATE POLICY "Super admins can update admin roles"
  ON admin_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role = 'super_admin'
      AND admin_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role = 'super_admin'
      AND admin_roles.is_active = true
    )
  );

-- ============================================
-- RLS Policies: Admin Audit Log
-- ============================================

-- Admins can read audit log
CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin', 'moderator')
      AND admin_roles.is_active = true
    )
  );

-- Admins can insert their own audit entries
CREATE POLICY "Admins can insert audit log entries"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_wallet_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.wallet_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin', 'moderator')
      AND admin_roles.is_active = true
    )
  );

-- ============================================
-- Seed default membership tiers
-- ============================================
INSERT INTO membership_tiers (name, slug, price_monthly, price_yearly, max_blocks, max_images, can_custom_image, can_social_links, can_works_showcase, priority_support, badge_color, description, sort_order)
VALUES
  ('Bronze', 'bronze', 999, 9990, 5, 3, false, true, false, false, '#cd7f32', 'Basic membership with essential features. Get started with your Web3 identity.', 1),
  ('Silver', 'silver', 2999, 29990, 20, 10, true, true, true, false, '#c0c0c0', 'Enhanced membership for active creators. Unlock custom images and works showcase.', 2),
  ('Gold', 'gold', 9999, 99990, 100, 50, true, true, true, true, '#ffd700', 'Premium membership for power users. Maximum blocks, priority support, and all features.', 3)
ON CONFLICT (slug) DO NOTHING;
