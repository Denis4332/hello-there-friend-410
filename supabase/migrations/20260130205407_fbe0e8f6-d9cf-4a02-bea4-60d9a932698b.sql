-- Funktion die prüft ob Kategorie existiert bevor Profil aktiviert wird
CREATE OR REPLACE FUNCTION check_profile_has_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM profile_categories WHERE profile_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Profil kann nicht aktiviert werden ohne mindestens eine Kategorie';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger bei UPDATE (z.B. Admin aktiviert Profil)
DROP TRIGGER IF EXISTS ensure_profile_has_category_update ON profiles;
CREATE TRIGGER ensure_profile_has_category_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_profile_has_category();

-- Trigger bei INSERT (falls direkt als active eingefügt)
DROP TRIGGER IF EXISTS ensure_profile_has_category_insert ON profiles;
CREATE TRIGGER ensure_profile_has_category_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_profile_has_category();