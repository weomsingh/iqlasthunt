-- ========================================
-- IQHUNT COMPREHENSIVE FIX
-- Run this ENTIRE file in Supabase SQL Editor
-- ========================================

-- PART 1: FIX SCHEMA (Bounties Table)
-- Ensures all columns required by the new frontend exist
-- ========================================

-- Make old columns nullable to prevent errors
ALTER TABLE public.bounties ALTER COLUMN requirements DROP NOT NULL;
ALTER TABLE public.bounties ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.bounties ALTER COLUMN deadline DROP NOT NULL;

-- Add new columns if missing
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ;
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS mission_pdf_url TEXT;
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS vault_locked NUMERIC DEFAULT 0;
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS entry_fee NUMERIC DEFAULT 0;
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS max_hunters INTEGER DEFAULT 10;

-- Update status check constraint to include 'live' and 'draft'
ALTER TABLE public.bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
ALTER TABLE public.bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('active', 'in_progress', 'reviewing', 'completed', 'cancelled', 'live', 'draft'));


-- PART 2: WAR ROOM SETUP (Real-time Chat)
-- Handles the publication error safely
-- ========================================

CREATE TABLE IF NOT EXISTS war_room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_war_room_bounty ON war_room_messages(bounty_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_sender ON war_room_messages(sender_id);

-- RLS
ALTER TABLE war_room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hunters can read bounty messages" ON war_room_messages;
CREATE POLICY "Hunters can read bounty messages" ON war_room_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hunter_stakes
    WHERE hunter_stakes.bounty_id = war_room_messages.bounty_id
    AND hunter_stakes.hunter_id = auth.uid()
    AND hunter_stakes.status = 'active'
  )
);

DROP POLICY IF EXISTS "Hunters can send messages" ON war_room_messages;
CREATE POLICY "Hunters can send messages" ON war_room_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hunter_stakes
    WHERE hunter_stakes.bounty_id = war_room_messages.bounty_id
    AND hunter_stakes.hunter_id = auth.uid()
    AND hunter_stakes.status = 'active'
  )
  AND sender_id = auth.uid()
);

-- Enable Realtime (Safe Block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'war_room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE war_room_messages;
  END IF;
END $$;


-- PART 3: RPC FUNCTIONS (Logic Layer)
-- Essential functions for Staking, Submitting, and Winning
-- ========================================

-- Function: stake_on_bounty
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
  SELECT wallet_balance, currency INTO v_hunter_balance, v_currency FROM profiles WHERE id = p_hunter_id;
  
  IF v_hunter_balance < p_stake_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  SELECT max_hunters INTO v_max_hunters FROM bounties WHERE id = p_bounty_id;
  SELECT COUNT(*) INTO v_current_hunters FROM hunter_stakes WHERE bounty_id = p_bounty_id AND status = 'active';
  
  IF v_current_hunters >= v_max_hunters THEN
    RETURN json_build_object('success', false, 'error', 'Bounty is full');
  END IF;
  
  UPDATE profiles SET wallet_balance = wallet_balance - p_stake_amount WHERE id = p_hunter_id;
  INSERT INTO hunter_stakes (bounty_id, hunter_id, stake_amount) VALUES (p_bounty_id, p_hunter_id, p_stake_amount);
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata) VALUES (p_hunter_id, 'stake', p_stake_amount, v_currency, 'completed', json_build_object('bounty_id', p_bounty_id));
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: submit_work
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
  IF NOT EXISTS (SELECT 1 FROM hunter_stakes WHERE bounty_id = p_bounty_id AND hunter_id = p_hunter_id AND status = 'active') THEN
    RETURN json_build_object('success', false, 'error', 'Not staked on this bounty');
  END IF;
  
  v_ai_score := (random() * 40 + 60)::NUMERIC(5,2);
  
  INSERT INTO submissions (bounty_id, hunter_id, submission_text, submission_file_url, ai_score)
  VALUES (p_bounty_id, p_hunter_id, p_submission_text, p_submission_file_url, v_ai_score)
  ON CONFLICT (bounty_id, hunter_id) DO UPDATE 
  SET submission_text = EXCLUDED.submission_text, submission_file_url = EXCLUDED.submission_file_url, updated_at = NOW();
  
  RETURN json_build_object('success', true, 'ai_score', v_ai_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: select_winner
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
  SELECT reward, currency, payer_id, vault_locked INTO v_bounty_reward, v_bounty_currency, v_payer_id, v_vault_locked FROM bounties WHERE id = p_bounty_id;
  
  UPDATE profiles SET wallet_balance = wallet_balance + v_bounty_reward, total_earnings = total_earnings + v_bounty_reward WHERE id = p_winner_id;
  UPDATE bounties SET status = 'completed', winner_id = p_winner_id, updated_at = NOW() WHERE id = p_bounty_id;
  UPDATE hunter_stakes SET status = 'won' WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;
  UPDATE hunter_stakes SET status = 'lost' WHERE bounty_id = p_bounty_id AND hunter_id != p_winner_id;
  UPDATE submissions SET status = 'winner' WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;
  
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata) VALUES (p_winner_id, 'win_prize', v_bounty_reward, v_bounty_currency, 'completed', json_build_object('bounty_id', p_bounty_id));
  
  IF v_vault_locked > v_bounty_reward THEN
      UPDATE profiles SET wallet_balance = wallet_balance + (v_vault_locked - v_bounty_reward) WHERE id = v_payer_id;
      INSERT INTO transactions (user_id, type, amount, currency, status, metadata) VALUES (v_payer_id, 'unlock_vault', (v_vault_locked - v_bounty_reward), v_bounty_currency, 'completed', json_build_object('bounty_id', p_bounty_id));
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Permissions
GRANT EXECUTE ON FUNCTION stake_on_bounty TO authenticated;
GRANT EXECUTE ON FUNCTION submit_work TO authenticated;
GRANT EXECUTE ON FUNCTION select_winner TO authenticated;
GRANT SELECT, INSERT ON war_room_messages TO authenticated;

