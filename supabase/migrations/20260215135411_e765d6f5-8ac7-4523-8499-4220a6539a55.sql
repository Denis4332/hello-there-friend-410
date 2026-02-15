
-- 1. Testprofile ohne Ablaufdatum löschen
DELETE FROM profiles 
WHERE payment_status = 'free' 
  AND premium_until IS NULL 
  AND top_ad_until IS NULL 
  AND status = 'active';

-- 2. Sicherheits-Trigger: Verhindert aktive Profile ohne Ablaufdatum
CREATE OR REPLACE FUNCTION public.validate_active_profile_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.premium_until IS NULL AND NEW.top_ad_until IS NULL THEN
    RAISE EXCEPTION 'Aktive Profile müssen ein Ablaufdatum haben (premium_until oder top_ad_until)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER enforce_active_profile_expiry
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_active_profile_expiry();
