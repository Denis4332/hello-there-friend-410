-- Security Fix: SET search_path für auto_geocode_profile Funktion
DROP FUNCTION IF EXISTS auto_geocode_profile CASCADE;

CREATE OR REPLACE FUNCTION auto_geocode_profile()
RETURNS TRIGGER AS $$
DECLARE
  geocode_result RECORD;
BEGIN
  IF NEW.postal_code IS NOT NULL AND NEW.city IS NOT NULL AND (NEW.lat IS NULL OR NEW.lng IS NULL) THEN
    SELECT 
      (content::json->>0)::json->>'lat' as lat,
      (content::json->>0)::json->>'lon' as lng
    INTO geocode_result
    FROM http((
      'GET',
      'https://nominatim.openstreetmap.org/search?postalcode=' || NEW.postal_code || '&city=' || NEW.city || '&country=Switzerland&format=json&limit=1',
      ARRAY[http_header('User-Agent', 'EscoriaApp/1.0')],
      NULL,
      NULL
    )::http_request) 
    WHERE status = 200 AND content::json != '[]'::json;

    IF geocode_result.lat IS NOT NULL THEN
      NEW.lat := geocode_result.lat::numeric;
      NEW.lng := geocode_result.lng::numeric;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger neu erstellen
DROP TRIGGER IF EXISTS trigger_auto_geocode_profile ON profiles;
CREATE TRIGGER trigger_auto_geocode_profile
  BEFORE INSERT OR UPDATE OF postal_code, city
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_geocode_profile();