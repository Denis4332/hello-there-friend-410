-- Phase 1: Monetarisierungs-System erweitern
-- Füge neue Felder für erweiterte Listing-Typen hinzu
ALTER TABLE profiles 
  ADD COLUMN listing_type TEXT DEFAULT 'free' CHECK (listing_type IN ('free', 'basic', 'premium', 'top')),
  ADD COLUMN premium_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN top_ad_until TIMESTAMP WITH TIME ZONE;

-- Migriere bestehende is_premium Werte zu listing_type
UPDATE profiles 
SET listing_type = CASE 
  WHEN is_premium = true THEN 'premium'
  ELSE 'basic'
END;

-- Erstelle Indizes für bessere Performance
CREATE INDEX idx_profiles_listing_type ON profiles(listing_type);
CREATE INDEX idx_profiles_premium_until ON profiles(premium_until) WHERE premium_until IS NOT NULL;
CREATE INDEX idx_profiles_top_ad_until ON profiles(top_ad_until) WHERE top_ad_until IS NOT NULL;

-- Phase 8: Site Settings für Pricing
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('pricing_free_title', 'Basis Inserat', 'text', 'content', 'Free Tier Titel', 'Titel für kostenloses Inserat-Paket'),
('pricing_free_price', 'GRATIS', 'text', 'content', 'Free Tier Preis', 'Preis-Anzeige für kostenloses Paket'),
('pricing_basic_title', 'Standard Inserat', 'text', 'content', 'Basic Tier Titel', 'Titel für Standard Inserat-Paket'),
('pricing_basic_price', 'CHF 49/Monat', 'text', 'content', 'Basic Tier Preis', 'Preis-Anzeige für Standard Paket'),
('pricing_premium_title', 'Premium Inserat', 'text', 'content', 'Premium Tier Titel', 'Titel für Premium Inserat-Paket'),
('pricing_premium_price', 'CHF 99/Monat', 'text', 'content', 'Premium Tier Preis', 'Preis-Anzeige für Premium Paket'),
('pricing_top_title', 'TOP AD Inserat', 'text', 'content', 'Top Tier Titel', 'Titel für TOP AD Inserat-Paket'),
('pricing_top_price', 'CHF 199/Monat', 'text', 'content', 'Top Tier Preis', 'Preis-Anzeige für TOP AD Paket'),
('pricing_page_title', 'Preise & Pakete', 'text', 'content', 'Preise Seiten-Titel', 'Haupt-Titel der Preise-Seite'),
('pricing_page_subtitle', 'Wähle das passende Paket für dein Inserat', 'text', 'content', 'Preise Seiten-Untertitel', 'Untertitel der Preise-Seite'),
('footer_cta_text', 'Jetzt Inserat erstellen', 'text', 'content', 'Footer CTA Text', 'Call-to-Action Text im Footer'),
('footer_cta_link', '/auth?mode=signup', 'text', 'content', 'Footer CTA Link', 'Link für Footer CTA Button')
ON CONFLICT (key) DO NOTHING;