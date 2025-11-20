-- GPS Auto-Update Trigger: Automatisch Geocoding bei Adressänderungen

-- 1. Funktion zum automatischen Geocoding erstellen
CREATE OR REPLACE FUNCTION auto_geocode_profile()
RETURNS TRIGGER AS $$
DECLARE
  geocode_result RECORD;
BEGIN
  -- Nur geocoden wenn city oder postal_code geändert wurde
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       NEW.city IS DISTINCT FROM OLD.city OR 
       NEW.postal_code IS DISTINCT FROM OLD.postal_code
     )) THEN
    
    -- Nur geocoden wenn city und postal_code vorhanden sind
    IF NEW.city IS NOT NULL AND NEW.postal_code IS NOT NULL THEN
      
      -- Versuche zu geocoden mit PostGIS/Nominatim ähnlicher Logik
      -- Dies ist ein Platzhalter - in Produktion würde man eine externe API aufrufen
      -- Für jetzt setzen wir lat/lng auf NULL damit der Geocoding-Job sie später verarbeitet
      
      -- Setze lat/lng auf NULL damit sie vom Geocoding-Edge-Function verarbeitet werden
      NEW.lat := NULL;
      NEW.lng := NULL;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Trigger erstellen der vor jedem INSERT/UPDATE läuft
DROP TRIGGER IF EXISTS trigger_auto_geocode_profile ON profiles;
CREATE TRIGGER trigger_auto_geocode_profile
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_geocode_profile();

-- 3. Kommentar hinzufügen
COMMENT ON FUNCTION auto_geocode_profile IS 
  'Automatisches Geocoding bei Adressänderungen - setzt lat/lng auf NULL damit Edge Function sie geocodet';
COMMENT ON TRIGGER trigger_auto_geocode_profile ON profiles IS 
  'Trigger für automatisches Geocoding bei city/postal_code Änderungen';