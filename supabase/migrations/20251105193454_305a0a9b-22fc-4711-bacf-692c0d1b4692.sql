-- PHASE 4: is_premium Feld entfernen (DB Cleanup)

-- Schritt 1: Sicherstellen, dass listing_type korrekt gesetzt ist
-- (Falls alte Profile noch is_premium=true aber listing_type='basic' haben)
UPDATE profiles 
SET listing_type = 'premium' 
WHERE listing_type = 'basic' 
  AND (premium_until IS NOT NULL OR top_ad_until IS NOT NULL);

-- Schritt 2: is_premium Spalte entfernen
ALTER TABLE profiles DROP COLUMN IF EXISTS is_premium;

-- Bestätigung in Logs
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration abgeschlossen: is_premium Feld wurde entfernt';
END $$;