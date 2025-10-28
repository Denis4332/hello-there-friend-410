-- Fix: Admin-Profil Status + Automatisierung via Trigger

-- 1. Sofort-Fix: Setze Admin-Profil auf 'active'
UPDATE profiles 
SET status = 'active' 
WHERE user_id = (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'admin' 
  LIMIT 1
);

-- 2. Funktion: Setze Admin-Profile automatisch auf 'active'
CREATE OR REPLACE FUNCTION auto_activate_admin_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Prüfe ob User Admin ist
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = NEW.user_id 
    AND role = 'admin'
  ) THEN
    NEW.status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger bei INSERT und UPDATE
DROP TRIGGER IF EXISTS set_admin_profile_active ON profiles;
CREATE TRIGGER set_admin_profile_active
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_activate_admin_profiles();