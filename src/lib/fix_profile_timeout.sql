-- Run this query in your Supabase SQL Editor to resolve profile creation timeouts and RLS issues.

-- 1. Ensure columns exist (Idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nationality') THEN
        ALTER TABLE profiles ADD COLUMN nationality text DEFAULT 'global';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'currency') THEN
        ALTER TABLE profiles ADD COLUMN currency text DEFAULT 'USD';
    END IF;
END $$;

-- 2. Drop restrictive policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3. Create Permissive Policies
-- Allow anyone to read profiles (needed for layout checks)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Allow authenticated users to INSERT their own profile
-- This is critical for the onboarding step.
-- We verify that the user ID matches the authenticated user.
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 4. Enable RLS (Should be already enabled, but just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Fix permissions for storage (avatar uploads) if needed
-- (Optional, uncomment if dealing with avatar upload issues)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
