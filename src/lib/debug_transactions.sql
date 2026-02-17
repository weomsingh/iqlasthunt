-- Debug: Check transactions table constraints and test insert
-- Run this to see what's blocking the insert

-- 1. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 2. Check constraints
SELECT
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'transactions';

-- 3. Test insert with sample data (using your admin ID)
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM profiles WHERE email = 'weomiqhunt@gmail.com';
    
    -- Try to insert a test transaction
    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
        admin_id,
        'deposit',
        100,
        'INR',
        'pending',
        '{"utr_number": "TEST123", "payment_method": "upi"}'::jsonb
    );
    
    RAISE NOTICE 'Test insert successful!';
    
    -- Clean up test
    DELETE FROM transactions WHERE metadata->>'utr_number' = 'TEST123';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test insert FAILED: %', SQLERRM;
END $$;
