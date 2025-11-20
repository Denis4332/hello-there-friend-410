-- Drop broken geocoding trigger and function (http extension not available)
DROP TRIGGER IF EXISTS trigger_auto_geocode_profile ON profiles;
DROP FUNCTION IF EXISTS auto_geocode_profile() CASCADE;