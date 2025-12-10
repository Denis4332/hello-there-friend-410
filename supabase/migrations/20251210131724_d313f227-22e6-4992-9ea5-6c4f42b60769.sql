-- Phase 2: Settings mit korrekten Keys hinzufügen (die der Code erwartet)
-- Kontakt-Info mit schema_contact_* Keys
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('schema_contact_type', 'customer service', 'text', 'advanced_seo', 'Schema.org: Kontakt-Typ', 'Art des Kontakts (z.B. customer service, sales)'),
('schema_contact_phone', '', 'text', 'advanced_seo', 'Schema.org: Telefon', 'Telefonnummer für Schema.org'),
('schema_contact_email', 'info@escoria.ch', 'text', 'advanced_seo', 'Schema.org: E-Mail', 'E-Mail-Adresse für Schema.org')
ON CONFLICT (key) DO NOTHING;

-- Adress-Info mit schema_address_* Keys
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('schema_address_street', '', 'text', 'advanced_seo', 'Schema.org: Strasse', 'Strassenadresse'),
('schema_address_city', 'Zürich', 'text', 'advanced_seo', 'Schema.org: Stadt', 'Stadt/Ort'),
('schema_address_region', 'ZH', 'text', 'advanced_seo', 'Schema.org: Region/Kanton', 'Kanton oder Region'),
('schema_address_postal', '', 'text', 'advanced_seo', 'Schema.org: PLZ', 'Postleitzahl'),
('schema_address_country', 'CH', 'text', 'advanced_seo', 'Schema.org: Land', 'Ländercode (z.B. CH, DE, AT)')
ON CONFLICT (key) DO NOTHING;

-- Social Media Links
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('schema_social_facebook', '', 'url', 'advanced_seo', 'Schema.org: Facebook URL', 'Facebook Seiten-URL'),
('schema_social_twitter', '', 'url', 'advanced_seo', 'Schema.org: Twitter URL', 'Twitter/X Profil-URL'),
('schema_social_instagram', '', 'url', 'advanced_seo', 'Schema.org: Instagram URL', 'Instagram Profil-URL'),
('schema_social_linkedin', '', 'url', 'advanced_seo', 'Schema.org: LinkedIn URL', 'LinkedIn Unternehmensseite-URL'),
('schema_social_youtube', '', 'url', 'advanced_seo', 'Schema.org: YouTube URL', 'YouTube Kanal-URL'),
('schema_org_same_as', '', 'textarea', 'advanced_seo', 'Schema.org: Weitere Social Links', 'Weitere Social-Media URLs (eine pro Zeile)')
ON CONFLICT (key) DO NOTHING;

-- Schema.org Description + Type
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('schema_org_description', 'ESCORIA - Die führende Kontaktplattform der Schweiz für verifizierte Profile und seriöse Kontakte.', 'textarea', 'advanced_seo', 'Schema.org: Beschreibung', 'Kurze Beschreibung der Organisation'),
('schema_org_type', 'Organization', 'text', 'advanced_seo', 'Schema.org: Typ', 'Organization, LocalBusiness, WebSite, oder Person')
ON CONFLICT (key) DO NOTHING;

-- Phase 3: SwissConnect → ESCORIA Updates
UPDATE site_settings SET value = 'https://escoria.ch' WHERE key = 'seo_canonical_base' AND value LIKE '%swissconnect%';
UPDATE site_settings SET value = 'info@escoria.ch' WHERE key = 'schema_org_email' AND value LIKE '%swissconnect%';
UPDATE site_settings SET value = 'ESCORIA - Die führende Kontaktplattform der Schweiz' WHERE key = 'og_image_alt' AND value LIKE '%SwissConnect%';
UPDATE site_settings SET value = '@escoria_ch' WHERE key = 'twitter_site' AND value LIKE '%swissconnect%';
UPDATE site_settings SET value = '@escoria_ch' WHERE key = 'twitter_creator' AND value LIKE '%swissconnect%';

-- Seitentitel aktualisieren
UPDATE site_settings SET value = REPLACE(value, 'SwissConnect', 'ESCORIA') WHERE value LIKE '%SwissConnect%';
UPDATE site_settings SET value = REPLACE(value, 'swissconnect', 'escoria') WHERE value LIKE '%swissconnect%';