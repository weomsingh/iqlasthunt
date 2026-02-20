-- ============================================================
-- IQHUNT SUPABASE RLS FIX - Run this entire script in Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================================

-- 1. PROFILES TABLE: Allow users to update their own profile
-- (The "new row violates RLS" error on Settings page is caused by this)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also ensure INSERT works for onboarding
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure SELECT works
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow public profile viewing (for leaderboard, war room, etc.)
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  USING (true);

-- 2. TRANSACTIONS TABLE: Allow users to insert their own transactions
-- (Deposit "Failed to submit" and Withdrawal "Failed to process" errors)
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can view all transactions
DROP POLICY IF EXISTS "Admin can view all transactions" ON transactions;
CREATE POLICY "Admin can view all transactions"
  ON transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admin can update transactions (for verify/reject)
DROP POLICY IF EXISTS "Admin can update transactions" ON transactions;
CREATE POLICY "Admin can update transactions"
  ON transactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- 3. BOUNTIES TABLE: Fix delete/status update
DROP POLICY IF EXISTS "Payers can update own bounties" ON bounties;
CREATE POLICY "Payers can update own bounties"
  ON bounties FOR UPDATE
  USING (auth.uid() = payer_id)
  WITH CHECK (auth.uid() = payer_id);

DROP POLICY IF EXISTS "Payers can insert bounties" ON bounties;
CREATE POLICY "Payers can insert bounties"
  ON bounties FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

DROP POLICY IF EXISTS "Anyone can view live bounties" ON bounties;
CREATE POLICY "Anyone can view live bounties"
  ON bounties FOR SELECT
  USING (true);

-- 4. HUNTER_STAKES: Allow hunters to manage stakes
DROP POLICY IF EXISTS "Hunters can manage own stakes" ON hunter_stakes;
CREATE POLICY "Hunters can manage own stakes"
  ON hunter_stakes FOR ALL
  USING (auth.uid() = hunter_id)
  WITH CHECK (auth.uid() = hunter_id);

DROP POLICY IF EXISTS "Anyone can view stakes" ON hunter_stakes;
CREATE POLICY "Anyone can view stakes"
  ON hunter_stakes FOR SELECT
  USING (true);

-- 5. SUBMISSIONS: Allow hunters to submit
DROP POLICY IF EXISTS "Hunters can manage own submissions" ON submissions;
CREATE POLICY "Hunters can manage own submissions"
  ON submissions FOR ALL
  USING (auth.uid() = hunter_id)
  WITH CHECK (auth.uid() = hunter_id);

DROP POLICY IF EXISTS "Payers can view submissions for their bounties" ON submissions;
CREATE POLICY "Payers can view submissions for their bounties"
  ON submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bounties WHERE id = bounty_id AND payer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Public can view submissions" ON submissions;
CREATE POLICY "Public can view submissions"
  ON submissions FOR SELECT
  USING (true);

-- ============================================================
-- DONE: Copy the above, go to Supabase > SQL Editor, paste and run
-- ============================================================
