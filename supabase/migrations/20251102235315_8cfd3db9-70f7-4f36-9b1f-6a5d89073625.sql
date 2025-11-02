-- Add column to control street visibility
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_street BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.show_street IS 'Whether to publicly display street address (privacy by default)';