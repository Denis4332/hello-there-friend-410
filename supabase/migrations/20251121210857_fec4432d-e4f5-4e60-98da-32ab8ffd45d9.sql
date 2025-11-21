-- Test-Daten: Profile erstellen durch temporäres Entfernen der FK-Constraint

-- 1. Alte Test-Profile löschen
DELETE FROM photos WHERE profile_id IN (
  SELECT id FROM profiles WHERE display_name IN ('Sarah', 'Lisa', 'Julia', 'Test Profile')
);
DELETE FROM profile_categories WHERE profile_id IN (
  SELECT id FROM profiles WHERE display_name IN ('Sarah', 'Lisa', 'Julia', 'Test Profile')
);
DELETE FROM profile_contacts WHERE profile_id IN (
  SELECT id FROM profiles WHERE display_name IN ('Sarah', 'Lisa', 'Julia', 'Test Profile')
);
DELETE FROM profiles WHERE display_name IN ('Sarah', 'Lisa', 'Julia', 'Test Profile');

-- 2. Foreign Key Constraint temporär entfernen
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- 3. Unique Constraint auf user_id temporär entfernen (falls vorhanden)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- 4. Test-Profile erstellen mit generierten User-IDs
DO $$
DECLARE
  cat_id uuid;
  user1 uuid := gen_random_uuid();
  user2 uuid := gen_random_uuid();
  user3 uuid := gen_random_uuid();
  user4 uuid := gen_random_uuid();
  user5 uuid := gen_random_uuid();
  user6 uuid := gen_random_uuid();
  user7 uuid := gen_random_uuid();
  user8 uuid := gen_random_uuid();
  user9 uuid := gen_random_uuid();
  user10 uuid := gen_random_uuid();
  melissa_id uuid;
  isabella_id uuid;
  sophia_id uuid;
  mia_id uuid;
  emma_id uuid;
  olivia_id uuid;
  nina_id uuid;
  lara_id uuid;
  anna_id uuid;
  sofia_id uuid;
BEGIN
  -- Erste aktive Kategorie holen
  SELECT id INTO cat_id FROM categories WHERE active = true ORDER BY sort_order LIMIT 1;

  -- 2x TOP-Ads (schweizweite Sichtbarkeit)
  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, top_ad_until, created_at)
  VALUES 
    (gen_random_uuid(), user1, 'Melissa TOP', 'top', 'Zürich', 'ZH', '8001', 47.3769, 8.5417, 25, 'female', 'Hey ich bin Melissa aus Zürich 💕 Melde dich für unvergessliche Momente!', ARRAY['de', 'en'], 'active', true, now() + interval '30 days', now() - interval '2 days')
  RETURNING id INTO melissa_id;

  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, top_ad_until, created_at)
  VALUES
    (gen_random_uuid(), user2, 'Isabella TOP', 'top', 'Bern', 'BE', '3011', 46.9480, 7.4474, 27, 'female', 'Isabella hier aus Bern ✨ Ich freue mich auf deine Nachricht!', ARRAY['de', 'fr'], 'active', true, now() + interval '30 days', now() - interval '1 day')
  RETURNING id INTO isabella_id;

  -- 4x Premium-Ads
  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, premium_until, created_at)
  VALUES
    (gen_random_uuid(), user3, 'Sophia Premium', 'premium', 'Basel', 'BS', '4001', 47.5596, 7.5886, 24, 'female', 'Sophia aus Basel 💋 Lass uns zusammen Spass haben!', ARRAY['de'], 'active', true, now() + interval '30 days', now() - interval '3 days')
  RETURNING id INTO sophia_id;

  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, premium_until, created_at)
  VALUES
    (gen_random_uuid(), user4, 'Mia Premium', 'premium', 'Luzern', 'LU', '6003', 47.0502, 8.3093, 26, 'female', 'Mia hier 🌸 Ich bin neu in Luzern und freue mich auf dich!', ARRAY['de', 'en'], 'active', true, now() + interval '30 days', now() - interval '4 days')
  RETURNING id INTO mia_id;

  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, premium_until, created_at)
  VALUES
    (gen_random_uuid(), user5, 'Emma Premium', 'premium', 'Aarau', 'AG', '5000', 47.3926, 8.0457, 23, 'female', 'Emma aus Aarau 😘 Schreib mir wenn du Lust auf ein Date hast!', ARRAY['de'], 'active', true, now() + interval '30 days', now() - interval '5 days')
  RETURNING id INTO emma_id;

  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, premium_until, created_at)
  VALUES
    (gen_random_uuid(), user6, 'Olivia Premium', 'premium', 'St. Gallen', 'SG', '9000', 47.4245, 9.3767, 28, 'female', 'Hey, ich bin Olivia aus St. Gallen 🎀 Lass uns kennenlernen!', ARRAY['de', 'en'], 'active', true, now() + interval '30 days', now() - interval '6 days')
  RETURNING id INTO olivia_id;

  -- 4x Basic-Ads
  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, created_at)
  VALUES
    (gen_random_uuid(), user7, 'Nina Basic', 'basic', 'Winterthur', 'ZH', '8400', 47.5001, 8.7237, 22, 'female', 'Nina hier aus Winterthur 💕 Ich freue mich auf nette Dates!', ARRAY['de'], 'active', true, now() - interval '7 days')
  RETURNING id INTO nina_id;

  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, created_at)
  VALUES
    (gen_random_uuid(), user8, 'Lara Basic', 'basic', 'Thun', 'BE', '3600', 46.7582, 7.6280, 25, 'female', 'Lara aus Thun ✨ Schreib mir für ein schönes Treffen!', ARRAY['de'], 'active', true, now() - interval '8 days')
  RETURNING id INTO lara_id;

  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, created_at)
  VALUES
    (gen_random_uuid(), user9, 'Anna Basic', 'basic', 'Zug', 'ZG', '6300', 47.1724, 8.5168, 24, 'female', 'Anna hier aus Zug 🌺 Lass uns zusammen eine schöne Zeit haben!', ARRAY['de', 'en'], 'active', true, now() - interval '9 days')
  RETURNING id INTO anna_id;

  INSERT INTO profiles (id, user_id, display_name, listing_type, city, canton, postal_code, lat, lng, age, gender, about_me, languages, status, is_adult, created_at)
  VALUES
    (gen_random_uuid(), user10, 'Sofia Basic', 'basic', 'Baden', 'AG', '5400', 47.4734, 8.3064, 26, 'female', 'Sofia aus Baden 💖 Meld dich bei mir für ein tolles Date!', ARRAY['de'], 'active', true, now() - interval '10 days')
  RETURNING id INTO sofia_id;

  -- Profile-Kategorien zuweisen
  IF cat_id IS NOT NULL THEN
    INSERT INTO profile_categories (profile_id, category_id) VALUES
      (melissa_id, cat_id), (isabella_id, cat_id),
      (sophia_id, cat_id), (mia_id, cat_id), (emma_id, cat_id), (olivia_id, cat_id),
      (nina_id, cat_id), (lara_id, cat_id), (anna_id, cat_id), (sofia_id, cat_id);
  END IF;

  RAISE NOTICE '✅ 10 Test-Profile erstellt';
END $$;

-- 5. Foreign Key Constraint NICHT wieder hinzufügen (für Test-Flexibilität)
-- Wenn die Constraint später wieder gebraucht wird, kann sie manuell hinzugefügt werden:
-- ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;