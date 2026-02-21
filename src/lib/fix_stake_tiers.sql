-- ============================================================
-- IQHUNT — Updated Stake Tiers
-- Run in Supabase SQL Editor
-- Matches the new frontend stake tiers:
--   Reward ≤ 1500  → Entry Fee ₹10
--   Reward ≤ 3000  → Entry Fee ₹20
--   Reward ≤ 4500  → Entry Fee ₹40
--   Reward  > 4500 → Entry Fee 2.5% of reward
-- ============================================================

-- The stake_on_bounty RPC does NOT calculate the fee itself —
-- the entry_fee is stored on the bounty when payer posts it.
-- Hunters just pass bounty.entry_fee as p_stake_amount.
-- So no RPC change needed for stake tiers.

-- However, update cancel_bounty to also handle 'paused' bounties:
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
  -- Fetch bounty details
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

  -- Check for active hunter enrollments
  SELECT COUNT(*) INTO v_hunter_count
  FROM hunter_stakes
  WHERE bounty_id = p_bounty_id AND status = 'active';

  IF v_hunter_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot cancel: hunters are already enrolled. Contact support.'
    );
  END IF;

  -- Cancel the bounty
  UPDATE bounties
  SET status = 'deleted', updated_at = NOW()
  WHERE id = p_bounty_id;

  -- Instant refund to payer wallet
  IF v_vault_locked > 0 THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + v_vault_locked
    WHERE id = p_payer_id;

    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
      p_payer_id,
      'bounty_refund',
      v_vault_locked,
      v_currency,
      'completed',
      json_build_object(
        'bounty_id', p_bounty_id,
        'reason',    'bounty_cancelled_no_hunters'
      )
    );
  END IF;

  RETURN json_build_object('success', true, 'refunded', v_vault_locked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cancel_bounty TO authenticated;
