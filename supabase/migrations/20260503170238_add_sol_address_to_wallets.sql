/*
  # Add Solana Wallet Address to Wallets

  1. Modified Tables
    - `wallets` - Added:
      - `sol_address` (text, nullable, unique) - Solana public key (base58-encoded)
      - `sol_connected_at` (timestamptz, nullable) - When the Sol wallet was linked

  2. Security
    - Users can update their own sol_address
    - Anyone authenticated can read sol_address (for profile display)
    - Unique constraint prevents one Sol address from being linked to multiple wallets

  3. Indexes
    - Index on sol_address for fast lookups
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'sol_address'
  ) THEN
    ALTER TABLE wallets ADD COLUMN sol_address text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'sol_connected_at'
  ) THEN
    ALTER TABLE wallets ADD COLUMN sol_connected_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallets_sol_address ON wallets(sol_address) WHERE sol_address IS NOT NULL;
