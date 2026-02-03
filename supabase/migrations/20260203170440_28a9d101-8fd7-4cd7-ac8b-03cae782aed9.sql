-- Step 1: Clean up existing duplicate primaries (keep only the newest per profile)
UPDATE photos p1
SET is_primary = false
WHERE is_primary = true
  AND id != (
    SELECT id FROM photos p2
    WHERE p2.profile_id = p1.profile_id
      AND p2.is_primary = true
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Step 2: Create unique partial index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_single_primary 
ON photos (profile_id) 
WHERE is_primary = true AND media_type = 'image';