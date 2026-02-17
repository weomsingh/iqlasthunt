-- FIX 1: Update Bounties Status Constraint
-- We need to drop the old constraint and add a new one that includes 'paused' and 'deleted'.
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
CHECK (status IN ('draft', 'live', 'in_progress', 'review', 'completed', 'cancelled', 'paused', 'deleted'));

-- FIX 2: Ensure Profile Policies are absolutely permissive for the user themselves
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- FIX 3: Ensure trigger doesn't block updates (if any)
-- (No specific trigger known, but good to ensure RLS is enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- FIX 4: Grant permissions explicitly
GRANT ALL ON bounties TO authenticated;
GRANT ALL ON profiles TO authenticated;
