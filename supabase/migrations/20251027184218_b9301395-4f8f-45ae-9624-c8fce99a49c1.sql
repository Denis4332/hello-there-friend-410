-- PHASE 1: Auto-Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    display_name,
    age,
    city,
    canton,
    status
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Neuer Nutzer'),
    18,
    'Zürich',
    'ZH',
    'pending'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- PHASE 2: Content Population
UPDATE site_settings SET value = 'https://facebook.com/yourpage' WHERE key = 'footer_social_facebook';
UPDATE site_settings SET value = 'https://instagram.com/yourpage' WHERE key = 'footer_social_instagram';
UPDATE site_settings SET value = 'https://twitter.com/yourpage' WHERE key = 'footer_social_twitter';
UPDATE site_settings SET value = 'https://linkedin.com/company/yourpage' WHERE key = 'footer_social_linkedin';
UPDATE site_settings SET value = '/* Füge hier dein Custom CSS ein */' WHERE key = 'advanced_custom_css';
UPDATE site_settings SET value = '// Füge hier dein Custom JavaScript ein' WHERE key = 'advanced_custom_js';
UPDATE site_settings SET value = '<!-- Füge hier deinen Analytics Code ein (z.B. Google Analytics) -->' WHERE key = 'advanced_analytics_code';

UPDATE categories SET intro_text = 'Entdecke die besten Profile in der Kategorie ' || name || '.' WHERE intro_text IS NULL;

UPDATE cities SET intro_text = 'Finde spannende Profile in ' || name || ', ' || (SELECT abbreviation FROM cantons WHERE cantons.id = cities.canton_id) || '.' WHERE intro_text IS NULL;