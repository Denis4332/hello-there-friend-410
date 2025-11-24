-- Funktion die GPS aus cities Tabelle holt
CREATE OR REPLACE FUNCTION set_profile_gps_from_city()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur wenn lat/lng NULL sind
  IF NEW.lat IS NULL OR NEW.lng IS NULL THEN
    SELECT c.lat, c.lng INTO NEW.lat, NEW.lng
    FROM cities c
    WHERE LOWER(c.name) = LOWER(NEW.city)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger der die Funktion aufruft
DROP TRIGGER IF EXISTS profile_auto_gps ON profiles;
CREATE TRIGGER profile_auto_gps
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_profile_gps_from_city();

-- Fix existierende Profile: GPS aus cities Tabelle holen
UPDATE profiles p
SET lat = c.lat, lng = c.lng
FROM cities c
WHERE LOWER(p.city) = LOWER(c.name)
AND (p.lat IS NULL OR p.lng IS NULL);

-- Füge ein Test-Profil für Kanton AG (Aargau) hinzu
INSERT INTO profiles (
  user_id, display_name, age, gender, city, canton, postal_code, 
  about_me, languages, is_adult, status, listing_type, premium_until, 
  availability_status, lat, lng
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Laura Aarau',
  26,
  'Weiblich',
  'Aarau',
  'AG',
  '5000',
  'Herzlich Willkommen! Ich biete exklusive Begleitung und entspannende Momente in Aarau und Umgebung. Diskret und stilvoll.',
  ARRAY['Deutsch', 'Englisch'],
  true,
  'active',
  'premium',
  NOW() + INTERVAL '30 days',
  'online',
  47.3925,
  8.0442
);

-- Kategorien für Laura Aarau Profil
INSERT INTO profile_categories (profile_id, category_id)
SELECT p.id, c.id
FROM profiles p
CROSS JOIN categories c
WHERE p.display_name = 'Laura Aarau'
AND c.slug IN ('cat_escort', 'cat_gfe', 'cat_sie_sucht_ihn')
LIMIT 3;

-- Kontaktdaten für Laura Aarau
INSERT INTO profile_contacts (profile_id, phone, whatsapp, email, website)
SELECT id, '+41 79 555 0016', '+41 79 555 0016', 'laura@aarau-escort.ch', 'www.laura-aarau.ch'
FROM profiles
WHERE display_name = 'Laura Aarau';