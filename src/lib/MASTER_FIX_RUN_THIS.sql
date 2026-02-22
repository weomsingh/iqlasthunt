-- ============================================================
-- IQHUNT — MASTER FIX SCRIPT
-- ⚡ Run this ENTIRE script in Supabase SQL Editor
-- This fixes ALL errors including transactions_type_check
-- ============================================================

-- ============================================================
-- STEP 1: Fix the transactions CHECK constraint
-- The current constraint only allows a limited set of types.
-- We need to add: bounty_refund, stake_partial_refund, unlock_vault
-- ============================================================

-- Drop the old constraint
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add an updated constraint with ALL needed types
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN (
    'deposit',
    'withdrawal',
    'stake',
    'win_prize',
    'refund_stake',
    'lock_vault',
    'unlock_vault',
    'bounty_refund',
    'stake_partial_refund'
  ));

-- ============================================================
-- STEP 2: Fix bounties status constraint to allow 'paused' and 'deleted'
-- ============================================================

ALTER TABLE public.bounties
  DROP CONSTRAINT IF EXISTS bounties_status_check;

ALTER TABLE public.bounties
  ADD CONSTRAINT bounties_status_check
  CHECK (status IN ('draft', 'live', 'paused', 'completed', 'cancelled', 'deleted'));

-- ============================================================
-- STEP 3: Fix submissions status constraint
-- ============================================================

ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_status_check;

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('pending', 'reviewed', 'winner', 'rejected', 'pending_review'));

-- ============================================================
-- STEP 4: Fix cancel_bounty() function
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_bounty(
  p_bounty_id UUID,
  p_payer_id  UUID
)
RETURNS JSON AS $$
DECLARE
  v_vault_locked  NUMERIC;
  v_currency      TEXT;
  v_hunter_count  INTEGER;
  v_status        TEXT;
BEGIN
  SELECT vault_locked, currency, status
  INTO v_vault_locked, v_currency, v_status
  FROM bounties
  WHERE id = p_bounty_id AND payer_id = p_payer_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bounty not found or access denied');
  END IF;

  IF v_status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot cancel a completed bounty');
  END IF;

  SELECT COUNT(*) INTO v_hunter_count
  FROM hunter_stakes
  WHERE bounty_id = p_bounty_id AND status = 'active';

  IF v_hunter_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot cancel: hunters are already enrolled. Contact support.'
    );
  END IF;

  UPDATE bounties
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_bounty_id;

  IF v_vault_locked IS NOT NULL AND v_vault_locked > 0 THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + v_vault_locked
    WHERE id = p_payer_id;

    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
      p_payer_id,
      'bounty_refund',
      v_vault_locked,
      COALESCE(v_currency, 'INR'),
      'completed',
      json_build_object('bounty_id', p_bounty_id, 'reason', 'bounty_cancelled_no_hunters')
    );
  END IF;

  RETURN json_build_object('success', true, 'refunded', COALESCE(v_vault_locked, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 5: Fix select_winner() function
-- ============================================================

CREATE OR REPLACE FUNCTION select_winner(
  p_bounty_id UUID,
  p_winner_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_bounty_reward  NUMERIC;
  v_bounty_currency TEXT;
  v_payer_id       UUID;
  v_vault_locked   NUMERIC;
  v_loser          RECORD;
  v_refund_amount  NUMERIC;
BEGIN
  SELECT reward, currency, payer_id, vault_locked
  INTO v_bounty_reward, v_bounty_currency, v_payer_id, v_vault_locked
  FROM bounties WHERE id = p_bounty_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bounty not found');
  END IF;

  -- Credit winner
  UPDATE profiles
  SET wallet_balance = wallet_balance + v_bounty_reward,
      total_earnings = total_earnings + v_bounty_reward
  WHERE id = p_winner_id;

  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  VALUES (
    p_winner_id, 'win_prize', v_bounty_reward, COALESCE(v_bounty_currency, 'INR'),
    'completed', json_build_object('bounty_id', p_bounty_id)
  );

  -- Return 30% to losers
  FOR v_loser IN
    SELECT hunter_id, stake_amount
    FROM hunter_stakes
    WHERE bounty_id = p_bounty_id
      AND hunter_id != p_winner_id
      AND status = 'active'
  LOOP
    v_refund_amount := ROUND(v_loser.stake_amount * 0.30, 2);

    UPDATE profiles
    SET wallet_balance = wallet_balance + v_refund_amount
    WHERE id = v_loser.hunter_id;

    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
      v_loser.hunter_id,
      'stake_partial_refund',
      v_refund_amount,
      COALESCE(v_bounty_currency, 'INR'),
      'completed',
      json_build_object(
        'bounty_id', p_bounty_id,
        'stake_paid', v_loser.stake_amount,
        'refund_pct', 30,
        'reason', 'participation_consolation'
      )
    );

    UPDATE hunter_stakes
    SET status = 'lost'
    WHERE bounty_id = p_bounty_id AND hunter_id = v_loser.hunter_id;
  END LOOP;

  -- Mark winner stake
  UPDATE hunter_stakes
  SET status = 'won'
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;

  -- Mark submission as winner
  UPDATE submissions
  SET status = 'winner'
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;

  -- Mark bounty completed
  UPDATE bounties
  SET status = 'completed', winner_id = p_winner_id, updated_at = NOW()
  WHERE id = p_bounty_id;

  -- Refund payer vault surplus
  IF v_vault_locked IS NOT NULL AND v_vault_locked > v_bounty_reward THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + (v_vault_locked - v_bounty_reward)
    WHERE id = v_payer_id;

    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
      v_payer_id, 'unlock_vault',
      (v_vault_locked - v_bounty_reward),
      COALESCE(v_bounty_currency, 'INR'),
      'completed',
      json_build_object('bounty_id', p_bounty_id)
    );
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 6: Fix submit_work() function
-- ============================================================

CREATE OR REPLACE FUNCTION submit_work(
  p_bounty_id          UUID,
  p_hunter_id          UUID,
  p_submission_text    TEXT,
  p_submission_file_url TEXT
)
RETURNS JSON AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM hunter_stakes
    WHERE bounty_id = p_bounty_id
      AND hunter_id = p_hunter_id
      AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not staked on this bounty');
  END IF;

  INSERT INTO submissions (bounty_id, hunter_id, submission_text, submission_file_url, status)
  VALUES (p_bounty_id, p_hunter_id, p_submission_text, p_submission_file_url, 'pending_review')
  ON CONFLICT (bounty_id, hunter_id) DO UPDATE
  SET submission_text     = EXCLUDED.submission_text,
      submission_file_url = EXCLUDED.submission_file_url,
      status              = 'pending_review',
      updated_at          = NOW();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 7: Fix stake_on_bounty() function
-- ============================================================

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
  v_bounty_currency TEXT;
BEGIN
  SELECT wallet_balance INTO v_hunter_balance
  FROM profiles WHERE id = p_hunter_id;

  IF v_hunter_balance < p_stake_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  SELECT max_hunters, currency INTO v_max_hunters, v_bounty_currency
  FROM bounties WHERE id = p_bounty_id AND status = 'live';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bounty not found or not live');
  END IF;

  SELECT COUNT(*) INTO v_current_hunters
  FROM hunter_stakes WHERE bounty_id = p_bounty_id AND status = 'active';

  IF v_current_hunters >= v_max_hunters THEN
    RETURN json_build_object('success', false, 'error', 'Bounty is full');
  END IF;

  -- Check if already staked
  IF EXISTS (SELECT 1 FROM hunter_stakes WHERE bounty_id = p_bounty_id AND hunter_id = p_hunter_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already staked on this bounty');
  END IF;

  UPDATE profiles
  SET wallet_balance = wallet_balance - p_stake_amount
  WHERE id = p_hunter_id;

  INSERT INTO hunter_stakes (bounty_id, hunter_id, stake_amount)
  VALUES (p_bounty_id, p_hunter_id, p_stake_amount);

  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  VALUES (
    p_hunter_id, 'stake', p_stake_amount,
    COALESCE(v_bounty_currency, 'INR'), 'completed',
    json_build_object('bounty_id', p_bounty_id)
  );

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 8: Fix RLS Policies
-- ============================================================

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Profiles (ensure update is allowed)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Bounties (ensure payer can update their own)
DROP POLICY IF EXISTS "Payers can update their bounties" ON public.bounties;
CREATE POLICY "Payers can update their bounties"
  ON public.bounties FOR UPDATE
  TO authenticated
  USING (auth.uid() = payer_id);

-- ============================================================
-- STEP 9: Grant all needed permissions
-- ============================================================

GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.bounties TO authenticated;
GRANT ALL ON public.hunter_stakes TO authenticated;
GRANT ALL ON public.submissions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION cancel_bounty TO authenticated;
GRANT EXECUTE ON FUNCTION select_winner TO authenticated;
GRANT EXECUTE ON FUNCTION submit_work TO authenticated;
GRANT EXECUTE ON FUNCTION stake_on_bounty TO authenticated;

-- ============================================================
-- VERIFY: Check constraint is updated
-- ============================================================
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'transactions_type_check';

SELECT 'SUCCESS: All fixes applied!' as status;
