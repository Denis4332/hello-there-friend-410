-- Fix security definer function by adding search_path
-- This prevents potential SQL injection via search_path manipulation

CREATE OR REPLACE FUNCTION public.auto_activate_admin_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;