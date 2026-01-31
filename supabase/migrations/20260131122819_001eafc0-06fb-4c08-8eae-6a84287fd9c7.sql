-- Banner System v2.0: First drop existing constraint, then migrate positions

-- Step 1: Drop the existing check constraint
ALTER TABLE advertisements DROP CONSTRAINT IF EXISTS advertisements_position_check;

-- Step 2: Update existing data - map old positions to new
UPDATE advertisements SET position = 'header_banner' WHERE position = 'top';
UPDATE advertisements SET position = 'in_grid' WHERE position = 'grid';
-- 'popup' stays 'popup'

-- Step 3: Set default priority to 50 for rotation
ALTER TABLE advertisements ALTER COLUMN priority SET DEFAULT 50;

-- Step 4: Update any NULL or 0 priority values
UPDATE advertisements SET priority = 50 WHERE priority IS NULL OR priority = 0;

-- Step 5: Add new check constraint with all 5 positions
ALTER TABLE advertisements 
  ADD CONSTRAINT advertisements_position_check 
  CHECK (position IN ('header_banner', 'in_content', 'in_grid', 'footer_banner', 'popup'));