-- FIX FOR PAYER DEPOSIT SUBMISSION ISSUES
-- Run this script in the Supabase SQL Editor to fix the transactions table schema.

-- 1. Add missing 'metadata' column if it doesn't exist
-- This is critical because the frontend sends metadata (UTR, payment method)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add missing 'currency' column if it doesn't exist
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- 3. Update status check constraint to include 'failed'
-- First, drop the existing constraint (if any) to avoid conflicts
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Then add the comprehensive constraint
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'failed', 'cancelled'));

-- 4. Update type check constraint to include all needed transaction types
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

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
    'earning',
    'refund',
    'bonus',
    'vault_lock',   -- Used in Vault.jsx
    'vault_unlock'  -- Used in Vault.jsx
));

-- 5. Grant permissions (just in case)
GRANT ALL ON public.transactions TO authenticated;
-- Note: UUID pks don't have sequences, so we don't need to grant on a sequence.

-- 6. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'transactions';
