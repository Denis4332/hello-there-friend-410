-- Create 7 new TOP ad profiles for testing
-- GPS coordinates will be auto-populated by profile_auto_gps trigger

-- Profile 1: Luna Exclusive (Winterthur, ZH)
INSERT INTO profiles (
  id, user_id, display_name, about_me, age, gender, city, canton, postal_code,
  listing_type, status, is_adult, languages, availability_status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Luna Exclusive',
  'Exklusive Begleitung für gehobene Ansprüche. Diskret, charmant und stilbewusst.',
  26, 'female', 'Winterthur', 'ZH', '8400',
  'top', 'active', true, ARRAY['Deutsch', 'Englisch'], 'online'
);

INSERT INTO profile_contacts (profile_id, phone, whatsapp, email)
VALUES ('11111111-1111-1111-1111-111111111111', '+41791234567', '+41791234567', 'luna@example.com');

INSERT INTO profile_categories (profile_id, category_id) VALUES
  ('11111111-1111-1111-1111-111111111111', '32855d30-4e35-4e98-92c1-a6b1b41db428'),
  ('11111111-1111-1111-1111-111111111111', '4982eb96-ef48-4e95-9c28-6ae1a780921f');

-- Profile 2: Diamond Lady (Bern, BE)
INSERT INTO profiles (
  id, user_id, display_name, about_me, age, gender, city, canton, postal_code,
  listing_type, status, is_adult, languages, availability_status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000001',
  'Diamond Lady',
  'Reife Dame mit Klasse und Erfahrung. Ich weiss, was Sie wollen.',
  38, 'female', 'Bern', 'BE', '3011',
  'top', 'active', true, ARRAY['Deutsch', 'Französisch'], 'online'
);

INSERT INTO profile_contacts (profile_id, phone, whatsapp, email)
VALUES ('22222222-2222-2222-2222-222222222222', '+41792345678', '+41792345678', 'diamond@example.com');

INSERT INTO profile_categories (profile_id, category_id) VALUES
  ('22222222-2222-2222-2222-222222222222', '70f9c34d-b53e-4724-a829-047b56672135'),
  ('22222222-2222-2222-2222-222222222222', '6e7218b7-94eb-40e7-bc90-b9654cf4de77');

-- Profile 3: Crystal VIP (Genève, GE)
INSERT INTO profiles (
  id, user_id, display_name, about_me, age, gender, city, canton, postal_code,
  listing_type, status, is_adult, languages, availability_status
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  'Crystal VIP',
  'Internationale VIP-Begleitung. Élégante, sophistiquée et discrète.',
  28, 'female', 'Genève', 'GE', '1201',
  'top', 'active', true, ARRAY['Français', 'Englisch', 'Deutsch'], 'online'
);

INSERT INTO profile_contacts (profile_id, phone, whatsapp, email, website)
VALUES ('33333333-3333-3333-3333-333333333333', '+41793456789', '+41793456789', 'crystal@example.com', 'https://crystal-vip.example.com');

INSERT INTO profile_categories (profile_id, category_id) VALUES
  ('33333333-3333-3333-3333-333333333333', '32855d30-4e35-4e98-92c1-a6b1b41db428'),
  ('33333333-3333-3333-3333-333333333333', '63cceaca-046a-46f6-a79f-d87723270589');

-- Profile 4: Amber Elite (Luzern, LU)
INSERT INTO profiles (
  id, user_id, display_name, about_me, age, gender, city, canton, postal_code,
  listing_type, status, is_adult, languages, availability_status
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000001',
  'Amber Elite',
  'Dominante Lady für besondere Sessions. Streng, aber fair.',
  32, 'female', 'Luzern', 'LU', '6003',
  'top', 'active', true, ARRAY['Deutsch', 'Englisch'], 'online'
);

INSERT INTO profile_contacts (profile_id, phone, whatsapp, email)
VALUES ('44444444-4444-4444-4444-444444444444', '+41794567890', '+41794567890', 'amber@example.com');

INSERT INTO profile_categories (profile_id, category_id) VALUES
  ('44444444-4444-4444-4444-444444444444', '8bee7d12-bf0d-42a0-966f-05c66ebdac62'),
  ('44444444-4444-4444-4444-444444444444', '5213b7a5-e381-43f2-8845-6866a0a63eca');

-- Profile 5: Ruby Deluxe (St. Gallen, SG)
INSERT INTO profiles (
  id, user_id, display_name, about_me, age, gender, city, canton, postal_code,
  listing_type, status, is_adult, languages, availability_status
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000001',
  'Ruby Deluxe',
  'Zärtliche Massagen und mehr. Entspannung für Körper und Seele.',
  29, 'female', 'St. Gallen', 'SG', '9000',
  'top', 'active', true, ARRAY['Deutsch'], 'online'
);

INSERT INTO profile_contacts (profile_id, phone, whatsapp, email)
VALUES ('55555555-5555-5555-5555-555555555555', '+41795678901', '+41795678901', 'ruby@example.com');

INSERT INTO profile_categories (profile_id, category_id) VALUES
  ('55555555-5555-5555-5555-555555555555', '70f9c34d-b53e-4724-a829-047b56672135'),
  ('55555555-5555-5555-5555-555555555555', '4982eb96-ef48-4e95-9c28-6ae1a780921f');

-- Profile 6: Jade Premium (Lugano, TI)
INSERT INTO profiles (
  id, user_id, display_name, about_me, age, gender, city, canton, postal_code,
  listing_type, status, is_adult, languages, availability_status
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  '00000000-0000-0000-0000-000000000001',
  'Jade Premium',
  'Elegante TS-Lady mit südländischem Charme. Bella e passionale.',
  27, 'female', 'Lugano', 'TI', '6900',
  'top', 'active', true, ARRAY['Italiano', 'Deutsch', 'Englisch'], 'online'
);

INSERT INTO profile_contacts (profile_id, phone, whatsapp, email)
VALUES ('66666666-6666-6666-6666-666666666666', '+41796789012', '+41796789012', 'jade@example.com');

INSERT INTO profile_categories (profile_id, category_id) VALUES
  ('66666666-6666-6666-6666-666666666666', '32855d30-4e35-4e98-92c1-a6b1b41db428'),
  ('66666666-6666-6666-6666-666666666666', '58a50463-1fd4-4ddb-bb0b-6624f84551ac');

-- Profile 7: Pearl Glamour (Basel, BS)
INSERT INTO profiles (
  id, user_id, display_name, about_me, age, gender, city, canton, postal_code,
  listing_type, status, is_adult, languages, availability_status
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  '00000000-0000-0000-0000-000000000001',
  'Pearl Glamour',
  'Glamouröse Begleitung für besondere Anlässe. Stilvoll und bezaubernd.',
  24, 'female', 'Basel', 'BS', '4051',
  'top', 'active', true, ARRAY['Deutsch', 'Englisch', 'Französisch'], 'online'
);

INSERT INTO profile_contacts (profile_id, phone, whatsapp, email)
VALUES ('77777777-7777-7777-7777-777777777777', '+41797890123', '+41797890123', 'pearl@example.com');

INSERT INTO profile_categories (profile_id, category_id) VALUES
  ('77777777-7777-7777-7777-777777777777', '70f9c34d-b53e-4724-a829-047b56672135'),
  ('77777777-7777-7777-7777-777777777777', '32855d30-4e35-4e98-92c1-a6b1b41db428');