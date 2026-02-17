-- FIX: Use correct column name 'stake_amount' in lock_target
-- Using dynamic SQL to safely handle both 'stake_amount' and 'amount' columns

CREATE OR REPLACE FUNCTION lock_target(p_bounty_id UUID, p_hunter_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_bounty RECORD;
  v_hunter_balance DECIMAL;
  v_entry_fee DECIMAL;
  v_currency TEXT;
  v_sql TEXT;
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

  -- 5. Create hunter_stakes record
  -- We use dynamic SQL to handle potential column name variations (stake_amount vs amount)
  -- The error "null value in column stake_amount" proves stake_amount exists and is not null.
  
  v_sql := 'INSERT INTO public.hunter_stakes (bounty_id, hunter_id, status, stake_amount';
  
  -- Check if 'amount' column also exists (for backward compatibility or redundancy)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hunter_stakes' AND column_name = 'amount') THEN
     v_sql := v_sql || ', amount';
  END IF;
  
  v_sql := v_sql || ') VALUES ($1, $2, $3, $4';
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hunter_stakes' AND column_name = 'amount') THEN
     v_sql := v_sql || ', $4'; -- Use same amount value
  END IF;
  
  v_sql := v_sql || ')';

  -- Execute the dynamic SQL
  EXECUTE v_sql USING p_bounty_id, p_hunter_id, 'active', v_entry_fee;
  
  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
