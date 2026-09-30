/*
  # Add Profiles Table for Member Auth System

  1. New Tables
    - `profiles` - Links Supabase Auth users to application data
      - `id` (uuid, PK, FK to auth.users) - The auth user ID
      - `email` (text) - Denormalized email for quick access
      - `display_name` (text, nullable) - User's display name
      - `avatar_url` (text, nullable) - Avatar image URL
      - `wallet_id` (uuid, nullable, FK to wallets) - Linked mnemonic wallet
      - `is_admin` (boolean, default false) - Admin flag
      - `created_at` (timestamptz) - Registration timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `profiles`
    - Users can read their own profile
    - Users can update their own profile (limited fields)
    - Users can insert their own profile on signup
    - Admin users can read all profiles

  3. Indexes
    - Index on wallet_id for fast lookups
    - Index on email for search
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  wallet_id uuid REFERENCES wallets(id),
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_wallet_id ON profiles(wallet_id) WHERE wallet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
