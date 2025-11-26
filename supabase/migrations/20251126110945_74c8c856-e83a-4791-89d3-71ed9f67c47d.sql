-- Phase 1: Remove auto-profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_profile();

-- Phase 2: Insert 17 missing cities with GPS coordinates
INSERT INTO cities (name, slug, canton_id, postal_code, lat, lng, intro_text) VALUES
('Zug', 'zug', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), '6300', 47.1724, 8.5153, 'Escorts und Begleitservice in Zug'),
('Fribourg', 'fribourg', (SELECT id FROM cantons WHERE abbreviation = 'FR'), '1700', 46.8065, 7.1522, 'Escorts und Begleitservice in Fribourg'),
('Chur', 'chur', (SELECT id FROM cantons WHERE abbreviation = 'GR'), '7000', 46.8499, 9.5331, 'Escorts und Begleitservice in Chur'),
('Schaffhausen', 'schaffhausen', (SELECT id FROM cantons WHERE abbreviation = 'SH'), '8200', 47.6979, 8.6345, 'Escorts und Begleitservice in Schaffhausen'),
('Solothurn', 'solothurn', (SELECT id FROM cantons WHERE abbreviation = 'SO'), '4500', 47.2081, 7.5376, 'Escorts und Begleitservice in Solothurn'),
('Neuchâtel', 'neuchatel', (SELECT id FROM cantons WHERE abbreviation = 'NE'), '2000', 46.9898, 6.9293, 'Escorts und Begleitservice in Neuchâtel'),
('Frauenfeld', 'frauenfeld', (SELECT id FROM cantons WHERE abbreviation = 'TG'), '8500', 47.5536, 8.8986, 'Escorts und Begleitservice in Frauenfeld'),
('Liestal', 'liestal', (SELECT id FROM cantons WHERE abbreviation = 'BL'), '4410', 47.4835, 7.7333, 'Escorts und Begleitservice in Liestal'),
('Herisau', 'herisau', (SELECT id FROM cantons WHERE abbreviation = 'AR'), '9100', 47.3864, 9.2797, 'Escorts und Begleitservice in Herisau'),
('Altdorf', 'altdorf', (SELECT id FROM cantons WHERE abbreviation = 'UR'), '6460', 46.8804, 8.6440, 'Escorts und Begleitservice in Altdorf'),
('Delémont', 'delemont', (SELECT id FROM cantons WHERE abbreviation = 'JU'), '2800', 47.3655, 7.3426, 'Escorts und Begleitservice in Delémont'),
('Glarus', 'glarus', (SELECT id FROM cantons WHERE abbreviation = 'GL'), '8750', 47.0413, 9.0681, 'Escorts und Begleitservice in Glarus'),
('Sarnen', 'sarnen', (SELECT id FROM cantons WHERE abbreviation = 'OW'), '6060', 46.8967, 8.2447, 'Escorts und Begleitservice in Sarnen'),
('Stans', 'stans', (SELECT id FROM cantons WHERE abbreviation = 'NW'), '6370', 46.9580, 8.3660, 'Escorts und Begleitservice in Stans'),
('Schwyz', 'schwyz', (SELECT id FROM cantons WHERE abbreviation = 'SZ'), '6430', 47.0207, 8.6533, 'Escorts und Begleitservice in Schwyz'),
('Appenzell', 'appenzell', (SELECT id FROM cantons WHERE abbreviation = 'AI'), '9050', 47.3317, 9.4095, 'Escorts und Begleitservice in Appenzell'),
('Bellinzona', 'bellinzona', (SELECT id FROM cantons WHERE abbreviation = 'TI'), '6500', 46.1920, 9.0177, 'Escorts und Begleitservice in Bellinzona')
ON CONFLICT (slug) DO NOTHING;