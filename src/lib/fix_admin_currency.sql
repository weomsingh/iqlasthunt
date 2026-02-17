-- Fix: Ensure admin user has currency set
-- Run this in Supabase SQL Editor

-- Set currency for admin user (default to INR)
UPDATE profiles 
SET currency = 'INR', 
    nationality = 'india'
WHERE email = 'weomiqhunt@gmail.com' 
  AND (currency IS NULL OR currency = '');

-- Verify
SELECT email, role, currency, nationality 
FROM profiles 
WHERE email = 'weomiqhunt@gmail.com';

SELECT 'Admin currency updated! Try deposit again.' as status;
