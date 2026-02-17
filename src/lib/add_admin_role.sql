-- Fix: Add 'admin' to allowed roles in profiles table
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint that includes 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('hunter', 'payer', 'admin'));

-- Verify the constraint
SELECT 'Admin role added successfully! You can now sign up as admin.' as status;
