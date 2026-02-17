-- ========================================
-- IQHUNT RPC FUNCTIONS
-- Run this in Supabase SQL Editor to enable Hunter/Payer functionality
-- ========================================

-- 1. Function to stake on a bounty (renamed/aliased as needed by frontend but canonical name is stake_on_bounty)
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
  v_currency TEXT;
BEGIN
  -- Check hunter's balance
  SELECT wallet_balance, currency INTO v_hunter_balance, v_currency
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
  VALUES (p_hunter_id, 'stake', p_stake_amount, v_currency, 'completed', json_build_object('bounty_id', p_bounty_id));
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to submit work
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
  VALUES (p_bounty_id, p_hunter_id, p_submission_text, p_submission_file_url, v_ai_score)
  ON CONFLICT (bounty_id, hunter_id) DO UPDATE 
  SET submission_text = EXCLUDED.submission_text, 
      submission_file_url = EXCLUDED.submission_file_url,
      updated_at = NOW();
  
  RETURN json_build_object('success', true, 'ai_score', v_ai_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to select winner
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
  VALUES (p_winner_id, 'win_prize', v_bounty_reward, v_bounty_currency, 'completed', json_build_object('bounty_id', p_bounty_id));
  
  -- Unlock payer's vault (return unused funds if any, usually vault_locked > reward)
  IF v_vault_locked > v_bounty_reward THEN
      UPDATE profiles 
      SET wallet_balance = wallet_balance + (v_vault_locked - v_bounty_reward)
      WHERE id = v_payer_id;
      
      -- Transaction record for unlocked funds
      INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
      VALUES (v_payer_id, 'unlock_vault', (v_vault_locked - v_bounty_reward), v_bounty_currency, 'completed', json_build_object('bounty_id', p_bounty_id));
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT PERMISSIONS (Essential)
GRANT EXECUTE ON FUNCTION stake_on_bounty TO authenticated;
GRANT EXECUTE ON FUNCTION submit_work TO authenticated;
GRANT EXECUTE ON FUNCTION select_winner TO authenticated;
