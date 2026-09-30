/*
# Add City System: cities, districts, votes, mayors, city funds

1. New Tables
  - `cities` — top-level city entity (name, slug, description, theme color, sort order, active flag)
  - `districts` — each city has 4 districts (A, B, C, D); each district has 99x12 blocks
  - `district_unlock_votes` — citizens vote to unlock the next district
  - `mayor_elections` — election records per city
  - `mayor_votes` — citizens vote for a mayoral candidate
  - `city_fund_proposals` — mayor proposes fund usage; citizens vote
  - `city_fund_votes` — citizens vote on fund proposals

2. Modified Tables
  - `blocks` — add `city_id` and `district_id` (nullable FKs)
  - `wallets` — add `city_id` (nullable FK)

3. Security (RLS)
  - Public read on cities, districts, elections, proposals, votes
  - Authenticated write for voting (one vote per wallet)
  - Admin management for cities, districts, elections

4. Notes
  - 4 default cities seeded
  - Each city gets 4 districts (A unlocked, B/C/D locked)
*/

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  theme_color text DEFAULT '#10b981',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read cities" ON cities;
CREATE POLICY "Anyone can read cities" ON cities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
CREATE POLICY "Admins can insert cities" ON cities FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
DROP POLICY IF EXISTS "Admins can update cities" ON cities;
CREATE POLICY "Admins can update cities" ON cities FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Districts
CREATE TABLE IF NOT EXISTS districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  letter char(1) NOT NULL CHECK (letter IN ('a','b','c','d')),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','voting','unlocked')),
  unlocked_at timestamptz,
  unlock_vote_threshold integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(city_id, letter)
);
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read districts" ON districts;
CREATE POLICY "Anyone can read districts" ON districts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can update districts" ON districts;
CREATE POLICY "Admins can update districts" ON districts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- District unlock votes
CREATE TABLE IF NOT EXISTS district_unlock_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  voter_wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(district_id, voter_wallet_id)
);
ALTER TABLE district_unlock_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read district votes" ON district_unlock_votes;
CREATE POLICY "Anyone can read district votes" ON district_unlock_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Wallet owner can vote for district unlock" ON district_unlock_votes;
CREATE POLICY "Wallet owner can vote for district unlock" ON district_unlock_votes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM wallets WHERE wallets.id = voter_wallet_id AND wallets.id = auth.uid()));

-- Mayor elections
CREATE TABLE IF NOT EXISTS mayor_elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'voting' CHECK (status IN ('pending','voting','closed')),
  term_start timestamptz,
  term_end timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mayor_elections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read mayor elections" ON mayor_elections;
CREATE POLICY "Anyone can read mayor elections" ON mayor_elections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage mayor elections" ON mayor_elections;
CREATE POLICY "Admins can manage mayor elections" ON mayor_elections FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Mayor votes
CREATE TABLE IF NOT EXISTS mayor_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid NOT NULL REFERENCES mayor_elections(id) ON DELETE CASCADE,
  candidate_wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  voter_wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(election_id, voter_wallet_id)
);
ALTER TABLE mayor_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read mayor votes" ON mayor_votes;
CREATE POLICY "Anyone can read mayor votes" ON mayor_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Wallet owner can vote for mayor" ON mayor_votes;
CREATE POLICY "Wallet owner can vote for mayor" ON mayor_votes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM wallets WHERE wallets.id = voter_wallet_id AND wallets.id = auth.uid()));

-- City fund proposals
CREATE TABLE IF NOT EXISTS city_fund_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  proposed_by_wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  amount integer NOT NULL DEFAULT 0,
  recipient_wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','executed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE city_fund_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read fund proposals" ON city_fund_proposals;
CREATE POLICY "Anyone can read fund proposals" ON city_fund_proposals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can create fund proposals" ON city_fund_proposals;
CREATE POLICY "Authenticated can create fund proposals" ON city_fund_proposals FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update fund proposals" ON city_fund_proposals;
CREATE POLICY "Admins can update fund proposals" ON city_fund_proposals FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- City fund votes
CREATE TABLE IF NOT EXISTS city_fund_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES city_fund_proposals(id) ON DELETE CASCADE,
  voter_wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('approve','reject')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, voter_wallet_id)
);
ALTER TABLE city_fund_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read fund votes" ON city_fund_votes;
CREATE POLICY "Anyone can read fund votes" ON city_fund_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Wallet owner can vote on fund" ON city_fund_votes;
CREATE POLICY "Wallet owner can vote on fund" ON city_fund_votes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM wallets WHERE wallets.id = voter_wallet_id AND wallets.id = auth.uid()));

-- Add city_id / district_id to blocks
DO $$ BEGIN
  ALTER TABLE blocks ADD COLUMN city_id uuid REFERENCES cities(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE blocks ADD COLUMN district_id uuid REFERENCES districts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add city_id to wallets
DO $$ BEGIN
  ALTER TABLE wallets ADD COLUMN city_id uuid REFERENCES cities(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Seed cities
INSERT INTO cities (name, slug, description, theme_color, sort_order)
VALUES
  ('Neo Tokyo', 'neo-tokyo', 'A neon-lit metropolis of the future', '#8b5cf6', 1),
  ('Cyber London', 'cyber-london', 'A foggy city of digital fog and stone', '#3b82f6', 2),
  ('Solar Dubai', 'solar-dubai', 'A golden desert hub of innovation', '#f59e0b', 3),
  ('Arctic Reykjavik', 'arctic-reykjavik', 'A cold northern city of clean energy', '#06b6d4', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed districts A-D for each city
INSERT INTO districts (city_id, letter, name, status)
SELECT c.id, 'a', c.name || ' - District A', 'unlocked'
FROM cities c
WHERE NOT EXISTS (SELECT 1 FROM districts d WHERE d.city_id = c.id AND d.letter = 'a');

INSERT INTO districts (city_id, letter, name, status)
SELECT c.id, 'b', c.name || ' - District B', 'locked'
FROM cities c
WHERE NOT EXISTS (SELECT 1 FROM districts d WHERE d.city_id = c.id AND d.letter = 'b');

INSERT INTO districts (city_id, letter, name, status)
SELECT c.id, 'c', c.name || ' - District C', 'locked'
FROM cities c
WHERE NOT EXISTS (SELECT 1 FROM districts d WHERE d.city_id = c.id AND d.letter = 'c');

INSERT INTO districts (city_id, letter, name, status)
SELECT c.id, 'd', c.name || ' - District D', 'locked'
FROM cities c
WHERE NOT EXISTS (SELECT 1 FROM districts d WHERE d.city_id = c.id AND d.letter = 'd');

UPDATE districts SET unlocked_at = now() WHERE letter = 'a' AND unlocked_at IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_districts_city ON districts(city_id);
CREATE INDEX IF NOT EXISTS idx_blocks_city_district ON blocks(city_id, district_id);
CREATE INDEX IF NOT EXISTS idx_wallets_city ON wallets(city_id);
CREATE INDEX IF NOT EXISTS idx_unlock_votes_district ON district_unlock_votes(district_id);
CREATE INDEX IF NOT EXISTS idx_mayor_votes_election ON mayor_votes(election_id);
CREATE INDEX IF NOT EXISTS idx_fund_proposals_city ON city_fund_proposals(city_id);
CREATE INDEX IF NOT EXISTS idx_fund_votes_proposal ON city_fund_votes(proposal_id);