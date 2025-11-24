-- 1. Verbesserte Trigger-Funktion mit deutschen Städtenamen-Mapping
CREATE OR REPLACE FUNCTION set_profile_gps_from_city()
RETURNS TRIGGER AS $$
DECLARE
  city_name TEXT;
BEGIN
  -- Nur wenn lat/lng NULL sind
  IF NEW.lat IS NULL OR NEW.lng IS NULL THEN
    -- Mapping für deutsche Städtenamen
    city_name := CASE LOWER(TRIM(NEW.city))
      WHEN 'genf' THEN 'Genève'
      WHEN 'biel' THEN 'Biel/Bienne'
      WHEN 'basel' THEN 'Basel'
      WHEN 'zürich' THEN 'Zürich'
      WHEN 'bern' THEN 'Bern'
      WHEN 'luzern' THEN 'Luzern'
      WHEN 'st. gallen' THEN 'St. Gallen'
      WHEN 'lausanne' THEN 'Lausanne'
      WHEN 'winterthur' THEN 'Winterthur'
      WHEN 'lugano' THEN 'Lugano'
      WHEN 'aarau' THEN 'Aarau'
      ELSE NEW.city
    END;
    
    -- GPS aus cities Tabelle holen
    SELECT c.lat, c.lng INTO NEW.lat, NEW.lng
    FROM cities c
    WHERE LOWER(c.name) = LOWER(city_name)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Manuelles GPS-Update für alle Profile ohne Koordinaten
UPDATE profiles p
SET 
  lat = CASE 
    WHEN LOWER(p.city) = 'biel' THEN 47.1368
    WHEN LOWER(p.city) = 'genf' THEN 46.2044
    WHEN LOWER(p.city) = 'aarau' THEN 47.3925
    ELSE p.lat
  END,
  lng = CASE 
    WHEN LOWER(p.city) = 'biel' THEN 7.2466
    WHEN LOWER(p.city) = 'genf' THEN 6.1432
    WHEN LOWER(p.city) = 'aarau' THEN 8.0442
    ELSE p.lng
  END
WHERE p.lat IS NULL OR p.lng IS NULL;

-- Fallback: Versuche GPS aus cities Tabelle zu holen (für andere fehlende)
UPDATE profiles p
SET lat = c.lat, lng = c.lng
FROM cities c
WHERE LOWER(c.name) = LOWER(p.city)
AND (p.lat IS NULL OR p.lng IS NULL);

-- 3. Setze 6 Profile auf "online" Status
UPDATE profiles
SET availability_status = 'online'
WHERE display_name IN (
  'Laura Aarau',
  'Sophia Premium',
  'Emma Biel',
  'Marco Genf',
  'Nina Lausanne',
  'Lara Premium'
)
AND status = 'active';