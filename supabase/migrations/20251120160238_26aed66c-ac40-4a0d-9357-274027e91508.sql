-- Auto-Geocoding Trigger für Profile
CREATE OR REPLACE FUNCTION auto_geocode_profile()
RETURNS TRIGGER AS $$
DECLARE
  geocode_result RECORD;
BEGIN
  -- Nur geocoden wenn PLZ und Stadt vorhanden sind und noch keine Koordinaten existieren
  IF NEW.postal_code IS NOT NULL AND NEW.city IS NOT NULL AND (NEW.lat IS NULL OR NEW.lng IS NULL) THEN
    -- Nominatim API Call via http extension
    SELECT 
      (response->>0)::json->>'lat' as lat,
      (response->>0)::json->>'lon' as lng
    INTO geocode_result
    FROM http((
      'GET',
      'https://nominatim.openstreetmap.org/search?postalcode=' || NEW.postal_code || '&city=' || NEW.city || '&country=Switzerland&format=json&limit=1',
      ARRAY[http_header('User-Agent', 'EscoriaApp/1.0')],
      NULL,
      NULL
    )::http_request) 
    WHERE status = 200 AND content::json != '[]'::json;

    -- Koordinaten setzen falls gefunden
    IF geocode_result.lat IS NOT NULL THEN
      NEW.lat := geocode_result.lat::numeric;
      NEW.lng := geocode_result.lng::numeric;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auf profiles Tabelle
DROP TRIGGER IF EXISTS trigger_auto_geocode_profile ON profiles;
CREATE TRIGGER trigger_auto_geocode_profile
  BEFORE INSERT OR UPDATE OF postal_code, city
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_geocode_profile();

-- Einmalige Geocodierung für existierende Profile ohne Koordinaten
DO $$
DECLARE
  profile_record RECORD;
  geocode_result RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, postal_code, city 
    FROM profiles 
    WHERE (lat IS NULL OR lng IS NULL) 
      AND postal_code IS NOT NULL 
      AND city IS NOT NULL
      AND status = 'active'
    LIMIT 100
  LOOP
    BEGIN
      -- Nominatim API Call
      SELECT 
        (content::json->>0)::json->>'lat' as lat,
        (content::json->>0)::json->>'lon' as lng
      INTO geocode_result
      FROM http((
        'GET',
        'https://nominatim.openstreetmap.org/search?postalcode=' || profile_record.postal_code || '&city=' || profile_record.city || '&country=Switzerland&format=json&limit=1',
        ARRAY[http_header('User-Agent', 'EscoriaApp/1.0')],
        NULL,
        NULL
      )::http_request)
      WHERE status = 200 AND content::json != '[]'::json;

      -- Update nur wenn Koordinaten gefunden wurden
      IF geocode_result.lat IS NOT NULL THEN
        UPDATE profiles 
        SET 
          lat = geocode_result.lat::numeric,
          lng = geocode_result.lng::numeric
        WHERE id = profile_record.id;
      END IF;

      -- Rate limiting: 1 Sekunde Pause zwischen Requests
      PERFORM pg_sleep(1);
    EXCEPTION
      WHEN OTHERS THEN
        -- Fehler loggen aber weitermachen
        RAISE NOTICE 'Geocoding failed for profile %: %', profile_record.id, SQLERRM;
    END;
  END LOOP;
END $$;