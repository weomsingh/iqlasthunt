-- FIX: Add missing 'amount' column to hunter_stakes
-- Run this in Supabase SQL Editor

-- 1. Add amount column if it doesn't exist
ALTER TABLE public.hunter_stakes 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 2. Add staked_at column if it doesn't exist
ALTER TABLE public.hunter_stakes 
ADD COLUMN IF NOT EXISTS staked_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add status column if it doesn't exist
ALTER TABLE public.hunter_stakes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. Re-create the lock_target function to be sure it uses the correct columns
CREATE OR REPLACE FUNCTION lock_target(p_bounty_id UUID, p_hunter_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_bounty RECORD;
  v_hunter_balance DECIMAL;
  v_entry_fee DECIMAL;
  v_currency TEXT;
BEGIN
  -- 1. Check if bounty exists and get entry fee
  SELECT * INTO v_bounty FROM public.bounties WHERE id = p_bounty_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bounty not found');
  END IF;

  v_entry_fee := COALESCE(v_bounty.entry_fee, 0);
  v_currency := COALESCE(v_bounty.currency, 'INR');

  -- 2. Check current user balance
  SELECT wallet_balance INTO v_hunter_balance FROM public.profiles WHERE id = p_hunter_id;
  
  IF v_hunter_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hunter profile not found');
  END IF;

  IF v_hunter_balance < v_entry_fee THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- 3. Check if already staked
  IF EXISTS (SELECT 1 FROM public.hunter_stakes WHERE bounty_id = p_bounty_id AND hunter_id = p_hunter_id AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already staked');
  END IF;

  -- 4. Perform stake (deduct balance, create stake record)
  
  -- Deduct from wallet
  UPDATE public.profiles 
  SET wallet_balance = wallet_balance - v_entry_fee
  WHERE id = p_hunter_id;

  -- Internal transaction log
  INSERT INTO public.transactions (user_id, type, amount, currency, status, bounty_id)
  VALUES (p_hunter_id, 'stake', v_entry_fee, v_currency, 'completed', p_bounty_id);

  -- Create stake
  INSERT INTO public.hunter_stakes (bounty_id, hunter_id, amount, status)
  VALUES (p_bounty_id, p_hunter_id, v_entry_fee, 'active');
  
  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
