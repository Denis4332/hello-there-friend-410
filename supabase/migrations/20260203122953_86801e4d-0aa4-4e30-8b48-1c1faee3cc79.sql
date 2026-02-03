-- Fix 4: Trigger soll nur beim AKTIVIEREN prüfen, nicht bei jedem Update
-- Vorher: Trigger feuert bei JEDEM Update wenn status = 'active'
-- Nachher: Trigger feuert NUR beim Wechsel AUF active

DROP TRIGGER IF EXISTS ensure_profile_has_category_update ON profiles;

CREATE TRIGGER ensure_profile_has_category_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active')
  EXECUTE FUNCTION check_profile_has_category();

-- Fix 5: Repariere das inkonsistente Profil (aktiv aber ohne Kategorien)
-- Dieses Profil ist status='active' aber hat 0 Kategorien
INSERT INTO profile_categories (profile_id, category_id)
SELECT 
  '06a895a5-9241-44f1-bbd2-efccdeee414d', 
  id 
FROM categories 
WHERE name = 'Damen'
ON CONFLICT DO NOTHING;

-- Füge sort_order zu photos hinzu falls nicht vorhanden (für Foto-Reihenfolge)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE photos ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;