-- Option 1: Add default value to role column
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'hunter'; 

-- Option 2: Update existing NULL records
UPDATE profiles 
SET role = 'hunter' 
WHERE role IS NULL;

-- Option 3: Make role nullable temporarily (if needed, but better to fix data)
-- ALTER TABLE profiles 
-- ALTER COLUMN role DROP NOT NULL;
