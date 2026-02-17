-- Fix: Allow users to insert deposit and withdrawal transactions
-- Run this in Supabase SQL Editor

-- Drop existing transaction policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view own transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND type IN ('deposit', 'withdrawal')
  );

-- Grant necessary permissions
GRANT SELECT, INSERT ON transactions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the fix
SELECT 'Transaction policies updated! Deposits and withdrawals should now work.' as status;
