-- ADMIN VERIFICATION FUNCTIONS

-- Function to verify deposit (admin only)
CREATE OR REPLACE FUNCTION verify_deposit(
    p_transaction_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
    v_new_balance NUMERIC;
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction
    FROM transactions
    WHERE id = p_transaction_id
    AND type = 'deposit'
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Transaction not found or already processed'
        );
    END IF;
    
    -- Update user balance
    UPDATE profiles
    SET wallet_balance = wallet_balance + v_transaction.amount
    WHERE id = v_transaction.user_id
    RETURNING wallet_balance INTO v_new_balance;
    
    -- Mark transaction as completed
    UPDATE transactions
    SET status = 'completed'
    WHERE id = p_transaction_id;
    
    RETURN json_build_object(
        'success', true,
        'new_balance', v_new_balance
    );
END;
$$;

-- Function to process withdrawal (admin only)
CREATE OR REPLACE FUNCTION process_withdrawal(
    p_transaction_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction
    FROM transactions
    WHERE id = p_transaction_id
    AND type = 'withdrawal'
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Transaction not found or already processed'
        );
    END IF;
    
    -- Note: Balance was already deducted when withdrawal was requested
    -- This function just marks it as completed after admin sends the money
    
    -- Mark transaction as completed
    UPDATE transactions
    SET status = 'completed'
    WHERE id = p_transaction_id;
    
    RETURN json_build_object(
        'success', true
    );
END;
$$;
