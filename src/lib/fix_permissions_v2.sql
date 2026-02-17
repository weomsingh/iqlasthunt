-- FIX 1: Allow users to update their own profiles (including company/website)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- FIX 2: Allow users to select their own transactions (for Vault)
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Apply grants just in case
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- Ensure columns exist (Redundant safety)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text DEFAULT '';
