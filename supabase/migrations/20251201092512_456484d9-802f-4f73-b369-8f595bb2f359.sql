-- First, drop the existing status check constraint and recreate with 'draft' included
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Add new constraint that includes 'draft' status
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('draft', 'pending', 'active', 'rejected', 'inactive'));

-- Now update existing ghost profiles (pending status but no photos) to draft status
UPDATE profiles 
SET status = 'draft', updated_at = now()
WHERE status = 'pending' 
AND id NOT IN (SELECT DISTINCT profile_id FROM photos WHERE profile_id IS NOT NULL);