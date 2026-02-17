-- FIX: Ensure full_name column exists in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text DEFAULT '';

-- Also ensure user_metadata in auth.users syncs properly if needed, but the error is about 'profiles' table cache or column.
-- Let's force a schema cache reload by notifying (Supabase does this automatically usually).

-- Just in case, grant again
GRANT ALL ON profiles TO authenticated;
