-- ============================================================
-- IQHUNT — FINANCIAL FLOW FIXES
-- Run this ENTIRE script in Supabase SQL Editor
-- Fixes:
--   1. Instant refund when payer cancels bounty (no hunters)
--   2. 30% stake return to losing hunters when winner is selected
--   3. Remove fake AI score from submit_work
-- ============================================================


-- ============================================================
-- FIX 1: cancel_bounty() — Instant full refund to payer
-- Called when payer deletes a bounty with NO hunters enrolled
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
  -- Fetch bounty details
  SELECT vault_locked, currency, status
  INTO v_vault_locked, v_currency, v_status
  FROM bounties
  WHERE id = p_bounty_id AND payer_id = p_payer_id;

  -- Bounty must exist and belong to this payer
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bounty not found or access denied');
  END IF;

  -- Cannot cancel a completed bounty
  IF v_status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot cancel a completed bounty');
  END IF;

  -- Check if any hunter has staked/enrolled
  SELECT COUNT(*) INTO v_hunter_count
  FROM hunter_stakes
  WHERE bounty_id = p_bounty_id AND status = 'active';

  IF v_hunter_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot cancel: hunters are already enrolled. Contact support.'
    );
  END IF;

  -- Mark bounty as deleted/cancelled
  UPDATE bounties
  SET status = 'deleted', updated_at = NOW()
  WHERE id = p_bounty_id;

  -- Instantly refund locked vault amount back to payer's wallet
  IF v_vault_locked > 0 THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + v_vault_locked
    WHERE id = p_payer_id;

    -- Log the refund transaction
    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
      p_payer_id,
      'bounty_refund',
      v_vault_locked,
      v_currency,
      'completed',
      json_build_object('bounty_id', p_bounty_id, 'reason', 'bounty_cancelled_no_hunters')
    );
  END IF;

  RETURN json_build_object('success', true, 'refunded', v_vault_locked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FIX 2: select_winner() — 30% stake return to losing hunters
-- When payer approves work, winner gets full reward.
-- Each losing hunter gets back 30% of their entry_fee (stake).
-- The remaining 70% of loser stakes = platform revenue.
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
  -- Get bounty details
  SELECT reward, currency, payer_id, vault_locked
  INTO v_bounty_reward, v_bounty_currency, v_payer_id, v_vault_locked
  FROM bounties WHERE id = p_bounty_id;

  -- ── WINNER: credit full reward ──────────────────────────────
  UPDATE profiles
  SET wallet_balance  = wallet_balance  + v_bounty_reward,
      total_earnings  = total_earnings  + v_bounty_reward
  WHERE id = p_winner_id;

  -- Log winner's prize transaction
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  VALUES (
    p_winner_id,
    'win_prize',
    v_bounty_reward,
    v_bounty_currency,
    'completed',
    json_build_object('bounty_id', p_bounty_id)
  );

  -- ── LOSERS: return 30% of their stake ──────────────────────
  FOR v_loser IN
    SELECT hunter_id, stake_amount
    FROM hunter_stakes
    WHERE bounty_id = p_bounty_id
      AND hunter_id != p_winner_id
      AND status = 'active'
  LOOP
    -- 30% stake refund
    v_refund_amount := ROUND(v_loser.stake_amount * 0.30, 2);

    -- Credit 30% back to loser's wallet
    UPDATE profiles
    SET wallet_balance = wallet_balance + v_refund_amount
    WHERE id = v_loser.hunter_id;

    -- Log refund transaction for loser
    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
      v_loser.hunter_id,
      'stake_partial_refund',
      v_refund_amount,
      v_bounty_currency,
      'completed',
      json_build_object(
        'bounty_id',    p_bounty_id,
        'stake_paid',   v_loser.stake_amount,
        'refund_pct',   30,
        'reason',       'participation_consolation'
      )
    );

    -- Mark loser's stake as lost
    UPDATE hunter_stakes
    SET status = 'lost'
    WHERE bounty_id = p_bounty_id AND hunter_id = v_loser.hunter_id;

  END LOOP;

  -- ── WINNER: mark their stake as won ────────────────────────
  UPDATE hunter_stakes
  SET status = 'won'
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;

  -- ── SUBMISSIONS: mark winner ────────────────────────────────
  UPDATE submissions
  SET status = 'winner'
  WHERE bounty_id = p_bounty_id AND hunter_id = p_winner_id;

  -- ── BOUNTY: mark completed ──────────────────────────────────
  UPDATE bounties
  SET status = 'completed', winner_id = p_winner_id, updated_at = NOW()
  WHERE id = p_bounty_id;

  -- ── PAYER: return surplus from vault (fee overage) ──────────
  IF v_vault_locked > v_bounty_reward THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + (v_vault_locked - v_bounty_reward)
    WHERE id = v_payer_id;

    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
      v_payer_id,
      'unlock_vault',
      (v_vault_locked - v_bounty_reward),
      v_bounty_currency,
      'completed',
      json_build_object('bounty_id', p_bounty_id)
    );
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FIX 3: submit_work() — Remove fake AI scoring
-- ============================================================
CREATE OR REPLACE FUNCTION submit_work(
  p_bounty_id          UUID,
  p_hunter_id          UUID,
  p_submission_text    TEXT,
  p_submission_file_url TEXT
)
RETURNS JSON AS $$
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

  -- Create or update submission (no AI score)
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
-- GRANT PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION cancel_bounty   TO authenticated;
GRANT EXECUTE ON FUNCTION select_winner   TO authenticated;
GRANT EXECUTE ON FUNCTION submit_work     TO authenticated;
