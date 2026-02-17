-- Comprehensive fix for transaction insert permissions
-- This removes ALL blocking policies and creates permissive ones
-- Run this in Supabase SQL Editor

-- 1. Disable RLS temporarily to test
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to avoid conflicts
-- Old/Potential names
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON transactions;

-- Names we are about to create (Fixes 42710 error)
DROP POLICY IF EXISTS "Anyone can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can insert own transactions" ON transactions;

-- 3. Re-enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create new permissive policies
CREATE POLICY "Anyone can view own transactions" 
  ON transactions FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert own transactions" 
  ON transactions FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. Grant full permissions
GRANT ALL ON transactions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6. Verify
SELECT 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'transactions';

SELECT 'All policies updated! Try deposit now.' as status;
