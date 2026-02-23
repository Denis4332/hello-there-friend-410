
-- ============================================================
-- Phase 1: Kanton-Normalisierung + Verification Unique Constraint
-- ============================================================

-- 1) Kantonnamen in profiles.canton zu Abkürzungen normalisieren
UPDATE profiles SET canton = 'ZH' WHERE lower(canton) IN ('zürich', 'zurich', 'zuerich');
UPDATE profiles SET canton = 'BE' WHERE lower(canton) IN ('bern', 'berne');
UPDATE profiles SET canton = 'LU' WHERE lower(canton) IN ('luzern', 'lucerne');
UPDATE profiles SET canton = 'UR' WHERE lower(canton) = 'uri';
UPDATE profiles SET canton = 'SZ' WHERE lower(canton) = 'schwyz';
UPDATE profiles SET canton = 'OW' WHERE lower(canton) = 'obwalden';
UPDATE profiles SET canton = 'NW' WHERE lower(canton) = 'nidwalden';
UPDATE profiles SET canton = 'GL' WHERE lower(canton) = 'glarus';
UPDATE profiles SET canton = 'ZG' WHERE lower(canton) = 'zug';
UPDATE profiles SET canton = 'FR' WHERE lower(canton) IN ('freiburg', 'fribourg');
UPDATE profiles SET canton = 'SO' WHERE lower(canton) = 'solothurn';
UPDATE profiles SET canton = 'BS' WHERE lower(canton) = 'basel-stadt';
UPDATE profiles SET canton = 'BL' WHERE lower(canton) = 'basel-landschaft';
UPDATE profiles SET canton = 'SH' WHERE lower(canton) = 'schaffhausen';
UPDATE profiles SET canton = 'AR' WHERE lower(canton) = 'appenzell ausserrhoden';
UPDATE profiles SET canton = 'AI' WHERE lower(canton) = 'appenzell innerrhoden';
UPDATE profiles SET canton = 'SG' WHERE lower(canton) IN ('st. gallen', 'st.gallen', 'sankt gallen');
UPDATE profiles SET canton = 'GR' WHERE lower(canton) IN ('graubünden', 'graubuenden');
UPDATE profiles SET canton = 'AG' WHERE lower(canton) = 'aargau';
UPDATE profiles SET canton = 'TG' WHERE lower(canton) = 'thurgau';
UPDATE profiles SET canton = 'TI' WHERE lower(canton) IN ('tessin', 'ticino');
UPDATE profiles SET canton = 'VD' WHERE lower(canton) IN ('waadt', 'vaud');
UPDATE profiles SET canton = 'VS' WHERE lower(canton) IN ('wallis', 'valais');
UPDATE profiles SET canton = 'NE' WHERE lower(canton) IN ('neuenburg', 'neuchâtel', 'neuchatel');
UPDATE profiles SET canton = 'GE' WHERE lower(canton) IN ('genf', 'genève', 'geneve');
UPDATE profiles SET canton = 'JU' WHERE lower(canton) = 'jura';

-- 2) Trigger to auto-normalize canton on future inserts/updates
CREATE OR REPLACE FUNCTION normalize_canton_to_abbreviation()
RETURNS TRIGGER AS $$
DECLARE
  canton_abbr TEXT;
BEGIN
  -- Skip if already an abbreviation (2-3 uppercase chars)
  IF NEW.canton ~ '^[A-Z]{2,3}$' THEN
    RETURN NEW;
  END IF;
  
  -- Look up abbreviation
  SELECT abbreviation INTO canton_abbr
  FROM cantons
  WHERE lower(name) = lower(NEW.canton)
     OR lower(abbreviation) = lower(NEW.canton)
  LIMIT 1;
  
  IF canton_abbr IS NOT NULL THEN
    NEW.canton := canton_abbr;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_normalize_canton ON profiles;
CREATE TRIGGER trg_normalize_canton
  BEFORE INSERT OR UPDATE OF canton ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION normalize_canton_to_abbreviation();

-- 3) Verification: Deduplicate + add unique constraint
-- Keep only the newest submission per profile
DELETE FROM verification_submissions vs
WHERE vs.id NOT IN (
  SELECT DISTINCT ON (profile_id) id
  FROM verification_submissions
  ORDER BY profile_id, submitted_at DESC NULLS LAST
);

-- Add unique constraint (prevents duplicates going forward)
ALTER TABLE verification_submissions
  ADD CONSTRAINT uq_verification_profile_id UNIQUE (profile_id);

-- 4) Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_canton ON profiles (canton);
CREATE INDEX IF NOT EXISTS idx_cities_lat_lng ON cities (lat, lng);
