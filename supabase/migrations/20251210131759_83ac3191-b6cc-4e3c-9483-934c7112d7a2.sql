-- Finale Settings die der Code erwartet aber noch fehlen
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
-- Open Graph Settings
('og_site_name', 'ESCORIA', 'text', 'seo', 'Open Graph: Site Name', 'Name der Website für Social Sharing'),
('og_locale', 'de_CH', 'text', 'seo', 'Open Graph: Locale', 'Sprache/Region Code'),
-- Twitter Card Type
('twitter_card_type', 'summary_large_image', 'text', 'seo', 'Twitter: Card Type', 'summary oder summary_large_image'),
-- LinkedIn
('linkedin_partner_id', '', 'text', 'tracking', 'LinkedIn: Partner ID', 'LinkedIn Partner ID für Tracking'),
-- Schema.org mit Code-erwarteten Keys
('schema_org_name', 'ESCORIA', 'text', 'advanced_seo', 'Schema.org: Organisations-Name', 'Offizieller Name der Organisation'),
('schema_org_logo', '', 'url', 'advanced_seo', 'Schema.org: Logo URL', 'URL zum Firmenlogo'),
('schema_org_url', 'https://escoria.ch', 'url', 'advanced_seo', 'Schema.org: Website URL', 'Offizielle Website URL'),
-- Contact Keys mit schema_contact_* Prefix
('schema_contact_type', 'customer service', 'text', 'advanced_seo', 'Schema.org: Kontakt-Typ', 'Art des Kontakts'),
('schema_contact_phone', '', 'text', 'advanced_seo', 'Schema.org: Kontakt-Telefon', 'Telefonnummer'),
('schema_contact_email', 'info@escoria.ch', 'text', 'advanced_seo', 'Schema.org: Kontakt-E-Mail', 'E-Mail-Adresse'),
-- Address Keys mit schema_address_* Prefix  
('schema_address_street', '', 'text', 'advanced_seo', 'Schema.org: Strasse', 'Strassenadresse'),
('schema_address_city', 'Zürich', 'text', 'advanced_seo', 'Schema.org: Stadt', 'Stadt/Ort'),
('schema_address_region', 'ZH', 'text', 'advanced_seo', 'Schema.org: Region', 'Kanton'),
('schema_address_postal', '', 'text', 'advanced_seo', 'Schema.org: PLZ', 'Postleitzahl'),
('schema_address_country', 'CH', 'text', 'advanced_seo', 'Schema.org: Land', 'Ländercode'),
-- Social Media
('schema_social_facebook', '', 'url', 'advanced_seo', 'Schema.org: Facebook', 'Facebook URL'),
('schema_social_twitter', '', 'url', 'advanced_seo', 'Schema.org: Twitter/X', 'Twitter URL'),
('schema_social_instagram', '', 'url', 'advanced_seo', 'Schema.org: Instagram', 'Instagram URL'),
('schema_social_linkedin', '', 'url', 'advanced_seo', 'Schema.org: LinkedIn', 'LinkedIn URL'),
('schema_social_youtube', '', 'url', 'advanced_seo', 'Schema.org: YouTube', 'YouTube URL')
ON CONFLICT (key) DO NOTHING;