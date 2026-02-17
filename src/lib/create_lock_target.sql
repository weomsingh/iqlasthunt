-- Create hunter_stakes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hunter_stakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES public.bounties(id) ON DELETE CASCADE,
  hunter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  staked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bounty_id, hunter_id)
);

-- Enable RLS on hunter_stakes
ALTER TABLE public.hunter_stakes ENABLE ROW LEVEL SECURITY;

-- Allow hunters to read their own stakes
DROP POLICY IF EXISTS "Hunters can read own stakes" ON public.hunter_stakes;
CREATE POLICY "Hunters can read own stakes" ON public.hunter_stakes
  FOR SELECT USING (auth.uid() = hunter_id);

-- Allow public read of stakes (for count)
DROP POLICY IF EXISTS "Public can read stakes" ON public.hunter_stakes;
CREATE POLICY "Public can read stakes" ON public.hunter_stakes
  FOR SELECT USING (true);

-- Allow anyone (authenticated) to insert stakes? No, only via function.
-- But creating a policy for insert is good practice if using direct insert.
-- Here we rely on function with SECURITY DEFINER.


-- Create lock_target function
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
