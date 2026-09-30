/*
  # Add admin update policy for blocks table

  1. Security Changes
    - Replace the existing wallet-owner-only UPDATE policy with one that also allows admins
    - Admins (profiles.is_admin = true) can update any block (needed for revoke functionality)
*/

DROP POLICY IF EXISTS "Wallet owner can update own blocks" ON blocks;

CREATE POLICY "Wallet owner or admin can update blocks"
  ON blocks FOR UPDATE
  TO authenticated
  USING (
    (owner_wallet_id IS NOT NULL AND owner_wallet_id = (
      SELECT w.id FROM wallets w
      WHERE w.mnemonic_hash = current_setting('request.jwt.claims->mnemonic_hash', true)
    ))
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    (owner_wallet_id IS NOT NULL AND owner_wallet_id = (
      SELECT w.id FROM wallets w
      WHERE w.mnemonic_hash = current_setting('request.jwt.claims->mnemonic_hash', true)
    ))
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
