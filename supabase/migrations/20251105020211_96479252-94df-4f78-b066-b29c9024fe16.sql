-- Korrektur: Entferne 'free' Option, nur basic/premium/top
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_listing_type_check;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_listing_type_check 
  CHECK (listing_type IN ('basic', 'premium', 'top'));

-- Setze alle 'free' Profile auf 'basic'
UPDATE profiles 
SET listing_type = 'basic' 
WHERE listing_type = 'free' OR listing_type IS NULL;

-- Entferne free pricing settings
DELETE FROM site_settings WHERE key IN ('pricing_free_title', 'pricing_free_price');

-- Update pricing text - nicht mehr "GRATIS Beta"
UPDATE site_settings SET value = 'CHF 49/Monat' WHERE key = 'pricing_basic_price';
UPDATE site_settings SET value = 'CHF 99/Monat' WHERE key = 'pricing_premium_price';
UPDATE site_settings SET value = 'CHF 199/Monat' WHERE key = 'pricing_top_price';