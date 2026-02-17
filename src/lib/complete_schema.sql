-- ========================================
-- IQHUNT COMPLETE DATABASE SCHEMA
-- Run this FIRST before war_room_setup.sql
-- ========================================

-- 1. PROFILES TABLE (Already exists, but we'll ensure all columns)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('hunter', 'payer', 'admin')),
  username TEXT UNIQUE NOT NULL,
  nationality TEXT,
  currency TEXT DEFAULT 'INR',
  accepted_covenant BOOLEAN DEFAULT FALSE,
  wallet_balance NUMERIC DEFAULT 0 CHECK (wallet_balance >= 0),
  total_earnings NUMERIC DEFAULT 0,
  expertise TEXT[],
  bio TEXT,
  date_of_birth DATE,
  is_organization BOOLEAN DEFAULT FALSE,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. BOUNTIES TABLE (Enhanced with all needed columns)
CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) > 0),
  description TEXT NOT NULL,
  reward NUMERIC NOT NULL CHECK (reward > 0),
  entry_fee NUMERIC NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  max_hunters INTEGER DEFAULT 10 CHECK (max_hunters > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT DEFAULT 'live' CHECK (status IN ('draft', 'live', 'completed', 'cancelled')),
  submission_deadline TIMESTAMPTZ NOT NULL,
  mission_pdf_url TEXT,
  vault_locked NUMERIC DEFAULT 0,
  winner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. HUNTER STAKES TABLE
CREATE TABLE IF NOT EXISTS public.hunter_stakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES public.bounties(id) ON DELETE CASCADE NOT NULL,
  hunter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stake_amount NUMERIC NOT NULL CHECK (stake_amount > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a hunter can only stake once per bounty
  UNIQUE(bounty_id, hunter_id)
);

-- 4. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES public.bounties(id) ON DELETE CASCADE NOT NULL,
  hunter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  submission_file_url TEXT,
  ai_score NUMERIC CHECK (ai_score >= 0 AND ai_score <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'winner', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a hunter can only submit once per bounty
  UNIQUE(bounty_id, hunter_id)
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'stake', 'win_prize', 'refund_stake', 'lock_vault', 'unlock_vault')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rejected')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_bounties_status ON public.bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_payer ON public.bounties(payer_id);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON public.bounties(submission_deadline);

CREATE INDEX IF NOT EXISTS idx_hunter_stakes_bounty ON public.hunter_stakes(bounty_id);
CREATE INDEX IF NOT EXISTS idx_hunter_stakes_hunter ON public.hunter_stakes(hunter_id);
CREATE INDEX IF NOT EXISTS idx_hunter_stakes_status ON public.hunter_stakes(status);

CREATE INDEX IF NOT EXISTS idx_submissions_bounty ON public.submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_hunter ON public.submissions(hunter_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunter_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Bounties are viewable by everyone" ON public.bounties;
DROP POLICY IF EXISTS "Payers can create bounties" ON public.bounties;
DROP POLICY IF EXISTS "Payers can update their bounties" ON public.bounties;

DROP POLICY IF EXISTS "Hunter stakes viewable by all" ON public.hunter_stakes;
DROP POLICY IF EXISTS "Hunters can create stakes" ON public.hunter_stakes;

DROP POLICY IF EXISTS "Submissions viewable by bounty participants" ON public.submissions;
DROP POLICY IF EXISTS "Hunters can create submissions" ON public.submissions;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- BOUNTIES POLICIES
CREATE POLICY "Bounties are viewable by everyone" 
  ON public.bounties FOR SELECT 
  USING (true);

CREATE POLICY "Payers can create bounties" 
  ON public.bounties FOR INSERT 
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Payers can update their bounties" 
  ON public.bounties FOR UPDATE 
  USING (auth.uid() = payer_id);

-- HUNTER STAKES POLICIES
CREATE POLICY "Hunter stakes viewable by all" 
  ON public.hunter_stakes FOR SELECT 
  USING (true);

CREATE POLICY "Hunters can create stakes" 
  ON public.hunter_stakes FOR INSERT 
  WITH CHECK (auth.uid() = hunter_id);

-- SUBMISSIONS POLICIES
CREATE POLICY "Submissions viewable by bounty participants" 
  ON public.submissions FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT payer_id FROM bounties WHERE id = bounty_id
      UNION
      SELECT hunter_id FROM hunter_stakes WHERE bounty_id = submissions.bounty_id
    )
  );

CREATE POLICY "Hunters can create submissions" 
  ON public.submissions FOR INSERT 
  WITH CHECK (
    auth.uid() = hunter_id
    AND EXISTS (
      SELECT 1 FROM hunter_stakes 
      WHERE bounty_id = submissions.bounty_id 
      AND hunter_id = auth.uid() 
      AND status = 'active'
    )
  );

-- TRANSACTIONS POLICIES
CREATE POLICY "Users can view own transactions" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- RPC FUNCTIONS
-- ========================================

-- Function to stake on a bounty
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
  -- Check hunter's balance
  SELECT wallet_balance INTO v_hunter_balance
  FROM profiles WHERE id = p_hunter_id;
  
  IF v_hunter_balance < p_stake_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Check if bounty is full
  SELECT max_hunters INTO v_max_hunters
  FROM bounties WHERE id = p_bounty_id;
  
  SELECT COUNT(*) INTO v_current_hunters
  FROM hunter_stakes WHERE bounty_id = p_bounty_id AND status = 'active';
  
  IF v_current_hunters >= v_max_hunters THEN
    RETURN json_build_object('success', false, 'error', 'Bounty is full');
  END IF;
  
  -- Deduct stake from wallet
  UPDATE profiles 
  SET wallet_balance = wallet_balance - p_stake_amount
  WHERE id = p_hunter_id;
  
  -- Create stake record
  INSERT INTO hunter_stakes (bounty_id, hunter_id, stake_amount)
  VALUES (p_bounty_id, p_hunter_id, p_stake_amount);
  
  -- Create transaction record
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  SELECT p_hunter_id, 'stake', p_stake_amount, currency, 'completed',
         json_build_object('bounty_id', p_bounty_id)
  FROM bounties WHERE id = p_bounty_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit work
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
  -- Check if hunter is staked
  IF NOT EXISTS (
    SELECT 1 FROM hunter_stakes 
    WHERE bounty_id = p_bounty_id 
    AND hunter_id = p_hunter_id 
    AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not staked on this bounty');
  END IF;
  
  -- Generate random AI score (you can replace this with actual AI scoring)
  v_ai_score := (random() * 40 + 60)::NUMERIC(5,2); -- 60-100 range
  
  -- Create submission
  INSERT INTO submissions (bounty_id, hunter_id, submission_text, submission_file_url, ai_score)
  VALUES (p_bounty_id, p_hunter_id, p_submission_text, p_submission_file_url, v_ai_score);
  
  RETURN json_build_object('success', true, 'ai_score', v_ai_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to select winner
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
  -- Get bounty details
  SELECT reward, currency, payer_id, vault_locked
  INTO v_bounty_reward, v_bounty_currency, v_payer_id, v_vault_locked
  FROM bounties WHERE id = p_bounty_id;
  
  -- Credit winner
  UPDATE profiles 
  SET wallet_balance = wallet_balance + v_bounty_reward,
      total_earnings = total_earnings + v_bounty_reward
  WHERE id = p_winner_id;
  
  -- Update bounty status
  UPDATE bounties 
  SET status = 'completed', winner_id = p_winner_id, updated_at = NOW()
  WHERE id = p_bounty_id;
  
  -- Update winner's stake
  UPDATE hunter_stakes 
  SET status = 'won' 
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;
  
  -- Update losers' stakes
  UPDATE hunter_stakes 
  SET status = 'lost' 
  WHERE bounty_id = p_bounty_id AND hunter_id != p_winner_id;
  
  -- Update winner's submission
  UPDATE submissions 
  SET status = 'winner' 
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;
  
  -- Create transaction for winner
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  VALUES (p_winner_id, 'win_prize', v_bounty_reward, v_bounty_currency, 'completed',
          json_build_object('bounty_id', p_bounty_id));
  
  -- Unlock payer's vault
  UPDATE profiles 
  SET wallet_balance = wallet_balance + (v_vault_locked - v_bounty_reward)
  WHERE id = v_payer_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bounties TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hunter_stakes TO authenticated;
GRANT SELECT, INSERT ON public.submissions TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.profiles IS 'User profiles for hunters, payers, and admins';
COMMENT ON TABLE public.bounties IS 'Bounties posted by payers';
COMMENT ON TABLE public.hunter_stakes IS 'Hunter stakes on bounties';
COMMENT ON TABLE public.submissions IS 'Hunter submissions for bounties';
COMMENT ON TABLE public.transactions IS 'All financial transactions';

COMMENT ON FUNCTION stake_on_bounty IS 'Stakes a hunter on a bounty, deducts entry fee from wallet';
COMMENT ON FUNCTION submit_work IS 'Submits hunter work with AI scoring';
COMMENT ON FUNCTION select_winner IS 'Selects a winner for a bounty and distributes rewards';
