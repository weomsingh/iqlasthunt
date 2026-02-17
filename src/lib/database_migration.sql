-- ========================================
-- IQHUNT DATABASE MIGRATION
-- Safely add missing columns and tables
-- ========================================

-- 1. Add missing columns to profiles table
DO $$ 
BEGIN
  -- Add columns only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'expertise') THEN
    ALTER TABLE profiles ADD COLUMN expertise TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_organization') THEN
    ALTER TABLE profiles ADD COLUMN is_organization BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE profiles ADD COLUMN company_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_balance') THEN
    ALTER TABLE profiles ADD COLUMN wallet_balance NUMERIC DEFAULT 0 CHECK (wallet_balance >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_earnings') THEN
    ALTER TABLE profiles ADD COLUMN total_earnings NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nationality') THEN
    ALTER TABLE profiles ADD COLUMN nationality TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accepted_covenant') THEN
    ALTER TABLE profiles ADD COLUMN accepted_covenant BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Add missing columns to bounties table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bounties' AND column_name = 'submission_deadline') THEN
    ALTER TABLE bounties ADD COLUMN submission_deadline TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bounties' AND column_name = 'entry_fee') THEN
    ALTER TABLE bounties ADD COLUMN entry_fee NUMERIC DEFAULT 0 CHECK (entry_fee >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bounties' AND column_name = 'max_hunters') THEN
    ALTER TABLE bounties ADD COLUMN max_hunters INTEGER DEFAULT 10 CHECK (max_hunters > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bounties' AND column_name = 'mission_pdf_url') THEN
    ALTER TABLE bounties ADD COLUMN mission_pdf_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bounties' AND column_name = 'vault_locked') THEN
    ALTER TABLE bounties ADD COLUMN vault_locked NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bounties' AND column_name = 'winner_id') THEN
    ALTER TABLE bounties ADD COLUMN winner_id UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bounties' AND column_name = 'updated_at') THEN
    ALTER TABLE bounties ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Update status column to accept new values
  ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
  ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
    CHECK (status IN ('draft', 'live', 'completed', 'cancelled', 'active'));
END $$;

-- 3. Create hunter_stakes table
CREATE TABLE IF NOT EXISTS hunter_stakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE NOT NULL,
  hunter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stake_amount NUMERIC NOT NULL CHECK (stake_amount > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(bounty_id, hunter_id)
);

-- 4. Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE NOT NULL,
  hunter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  submission_file_url TEXT,
  ai_score NUMERIC CHECK (ai_score >= 0 AND ai_score <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'winner', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(bounty_id, hunter_id)
);

-- 5. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'stake', 'win_prize', 'refund_stake', 'lock_vault', 'unlock_vault')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rejected')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_payer ON bounties(payer_id);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(submission_deadline);

CREATE INDEX IF NOT EXISTS idx_hunter_stakes_bounty ON hunter_stakes(bounty_id);
CREATE INDEX IF NOT EXISTS idx_hunter_stakes_hunter ON hunter_stakes(hunter_id);
CREATE INDEX IF NOT EXISTS idx_hunter_stakes_status ON hunter_stakes(status);

CREATE INDEX IF NOT EXISTS idx_submissions_bounty ON submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_hunter ON submissions(hunter_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunter_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate bounties policies
DROP POLICY IF EXISTS "Bounties are viewable by everyone" ON bounties;
DROP POLICY IF EXISTS "Payers can create bounties" ON bounties;
DROP POLICY IF EXISTS "Payers can update their bounties" ON bounties;

CREATE POLICY "Bounties are viewable by everyone" 
  ON bounties FOR SELECT USING (true);

CREATE POLICY "Payers can create bounties" 
  ON bounties FOR INSERT 
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Payers can update their bounties" 
  ON bounties FOR UPDATE 
  USING (auth.uid() = payer_id);

-- Hunter stakes policies
DROP POLICY IF EXISTS "Hunter stakes viewable by all" ON hunter_stakes;
DROP POLICY IF EXISTS "Hunters can create stakes" ON hunter_stakes;

CREATE POLICY "Hunter stakes viewable by all" 
  ON hunter_stakes FOR SELECT USING (true);

CREATE POLICY "Hunters can create stakes" 
  ON hunter_stakes FOR INSERT 
  WITH CHECK (auth.uid() = hunter_id);

-- Submissions policies
DROP POLICY IF EXISTS "Submissions viewable by bounty participants" ON submissions;
DROP POLICY IF EXISTS "Hunters can create submissions" ON submissions;

CREATE POLICY "Submissions viewable by bounty participants" 
  ON submissions FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT payer_id FROM bounties WHERE id = bounty_id
      UNION
      SELECT hunter_id FROM hunter_stakes WHERE bounty_id = submissions.bounty_id
    )
  );

CREATE POLICY "Hunters can create submissions" 
  ON submissions FOR INSERT 
  WITH CHECK (
    auth.uid() = hunter_id
    AND EXISTS (
      SELECT 1 FROM hunter_stakes 
      WHERE bounty_id = submissions.bounty_id 
      AND hunter_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;

CREATE POLICY "Users can view own transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- RPC FUNCTIONS
-- ========================================

-- Function: Stake on bounty
CREATE OR REPLACE FUNCTION stake_on_bounty(
  p_bounty_id UUID,
  p_hunter_id UUID,
  p_stake_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_hunter_balance NUMERIC;
  v_max_hunters INTEGER;
  v_current_hunters INTEGER;
BEGIN
  SELECT wallet_balance INTO v_hunter_balance
  FROM profiles WHERE id = p_hunter_id;
  
  IF v_hunter_balance < p_stake_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  SELECT max_hunters INTO v_max_hunters
  FROM bounties WHERE id = p_bounty_id;
  
  SELECT COUNT(*) INTO v_current_hunters
  FROM hunter_stakes WHERE bounty_id = p_bounty_id AND status = 'active';
  
  IF v_current_hunters >= v_max_hunters THEN
    RETURN json_build_object('success', false, 'error', 'Bounty is full');
  END IF;
  
  UPDATE profiles 
  SET wallet_balance = wallet_balance - p_stake_amount
  WHERE id = p_hunter_id;
  
  INSERT INTO hunter_stakes (bounty_id, hunter_id, stake_amount)
  VALUES (p_bounty_id, p_hunter_id, p_stake_amount);
  
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  SELECT p_hunter_id, 'stake', p_stake_amount, currency, 'completed',
         json_build_object('bounty_id', p_bounty_id)::jsonb
  FROM bounties WHERE id = p_bounty_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Submit work
CREATE OR REPLACE FUNCTION submit_work(
  p_bounty_id UUID,
  p_hunter_id UUID,
  p_submission_text TEXT,
  p_submission_file_url TEXT
)
RETURNS JSON AS $$
DECLARE
  v_ai_score NUMERIC;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM hunter_stakes 
    WHERE bounty_id = p_bounty_id 
    AND hunter_id = p_hunter_id 
    AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not staked on this bounty');
  END IF;
  
  v_ai_score := (random() * 40 + 60)::NUMERIC(5,2);
  
  INSERT INTO submissions (bounty_id, hunter_id, submission_text, submission_file_url, ai_score)
  VALUES (p_bounty_id, p_hunter_id, p_submission_text, p_submission_file_url, v_ai_score);
  
  RETURN json_build_object('success', true, 'ai_score', v_ai_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Select winner
CREATE OR REPLACE FUNCTION select_winner(
  p_bounty_id UUID,
  p_winner_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_bounty_reward NUMERIC;
  v_bounty_currency TEXT;
  v_payer_id UUID;
  v_vault_locked NUMERIC;
BEGIN
  SELECT reward, currency, payer_id, COALESCE(vault_locked, 0)
  INTO v_bounty_reward, v_bounty_currency, v_payer_id, v_vault_locked
  FROM bounties WHERE id = p_bounty_id;
  
  UPDATE profiles 
  SET wallet_balance = wallet_balance + v_bounty_reward,
      total_earnings = COALESCE(total_earnings, 0) + v_bounty_reward
  WHERE id = p_winner_id;
  
  UPDATE bounties 
  SET status = 'completed', winner_id = p_winner_id, updated_at = NOW()
  WHERE id = p_bounty_id;
  
  UPDATE hunter_stakes 
  SET status = 'won' 
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;
  
  UPDATE hunter_stakes 
  SET status = 'lost' 
  WHERE bounty_id = p_bounty_id AND hunter_id != p_winner_id;
  
  UPDATE submissions 
  SET status = 'winner' 
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;
  
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  VALUES (p_winner_id, 'win_prize', v_bounty_reward, v_bounty_currency, 'completed',
          json_build_object('bounty_id', p_bounty_id)::jsonb);
  
  IF v_vault_locked > v_bounty_reward THEN
    UPDATE profiles 
    SET wallet_balance = wallet_balance + (v_vault_locked - v_bounty_reward)
    WHERE id = v_payer_id;
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON bounties TO authenticated;
GRANT SELECT, INSERT, UPDATE ON hunter_stakes TO authenticated;
GRANT SELECT, INSERT ON submissions TO authenticated;
GRANT SELECT, INSERT ON transactions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database migration completed successfully!';
  RAISE NOTICE 'Tables: profiles, bounties, hunter_stakes, submissions, transactions';
  RAISE NOTICE 'Next: Run war_room_setup.sql';
END $$;
