-- Fix: Delete existing profile for admin email to allow fresh signup
-- Run this in Supabase SQL Editor

-- Delete any existing profile for the admin email
DELETE FROM profiles WHERE email = 'weomiqhunt@gmail.com';

-- Verify deletion
SELECT 'Old profile deleted! You can now sign up fresh.' as status;

-- If you want to check what was deleted (run separately):
-- SELECT * FROM profiles WHERE email = 'weomiqhunt@gmail.com';
