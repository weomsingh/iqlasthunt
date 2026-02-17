-- FIX FOR BOUNTY CREATION ERRORS
-- Run this in Supabase SQL Editor

-- 1. Make 'requirements' column nullable (or redundant if description covers it)
ALTER TABLE public.bounties 
ALTER COLUMN requirements DROP NOT NULL;

-- 2. Make 'category' column nullable (in case it's not used in new form)
ALTER TABLE public.bounties 
ALTER COLUMN category DROP NOT NULL;

-- 3. Make 'deadline' nullable if we are using 'submission_deadline' instead
-- Or better: ensure we fill it. But post form uses 'submission_deadline'.
-- Let's rename or alias columns if needed, but for now just relax constraints.
ALTER TABLE public.bounties 
ALTER COLUMN deadline DROP NOT NULL;

-- 4. Add missing columns used by PostBounty.jsx if they don't exist
ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ;

ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS mission_pdf_url TEXT;

ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS vault_locked NUMERIC DEFAULT 0;

ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS entry_fee NUMERIC DEFAULT 0;

ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS max_hunters INTEGER DEFAULT 10;

-- 5. Update constraints (if needed) to allow 'live' status
ALTER TABLE public.bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
ALTER TABLE public.bounties 
ADD CONSTRAINT bounties_status_check 
CHECK (status IN ('active', 'in_progress', 'reviewing', 'completed', 'cancelled', 'live', 'draft'));

-- 6. Verify schema
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'bounties';
