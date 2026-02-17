-- Add missing columns to profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text DEFAULT '';

-- Ensure bounties table has a status column that supports 'deleted' and 'paused'
-- We'll just add a check constraint update if needed, but for now assuming text is fine.
-- (No action needed if it's text, but good to keep in mind)

-- Grant permissions just in case
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
