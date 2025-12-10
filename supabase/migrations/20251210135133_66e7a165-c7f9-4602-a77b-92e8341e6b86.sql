-- Add 20 missing SEO settings with exact keys the code expects
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
-- Open Graph (kritisch für Social Sharing)
('og_site_name', 'ESCORIA', 'text', 'seo', 'Open Graph: Site Name', 'Name der Website für Social Sharing'),
('og_locale', 'de_CH', 'text', 'seo', 'Open Graph: Locale', 'Sprache/Region Code'),
('twitter_card_type', 'summary_large_image', 'text', 'seo', 'Twitter: Card Type', 'summary, summary_large_image, app, player'),
('linkedin_partner_id', '', 'text', 'tracking', 'LinkedIn: Partner ID', 'LinkedIn Partner ID für Tracking'),

-- Schema.org Organization (kritisch für Rich Results)
('schema_org_name', 'ESCORIA', 'text', 'advanced_seo', 'Schema.org: Firmenname', 'Offizieller Name der Organisation'),
('schema_org_logo', 'https://escoria.ch/images/escoria-logo.png', 'url', 'advanced_seo', 'Schema.org: Logo URL', 'URL zum Firmenlogo'),
('schema_org_url', 'https://escoria.ch', 'url', 'advanced_seo', 'Schema.org: Website URL', 'Offizielle Website URL'),

-- Schema.org ContactPoint (für Google Knowledge Panel)
('schema_contact_type', 'customer service', 'text', 'advanced_seo', 'Schema: Kontakt Typ', 'z.B. customer service, sales'),
('schema_contact_phone', '', 'text', 'advanced_seo', 'Schema: Telefon', 'Kontakt-Telefonnummer'),
('schema_contact_email', 'info@escoria.ch', 'text', 'advanced_seo', 'Schema: Email', 'Kontakt-Email'),

-- Schema.org PostalAddress (für lokale SEO)
('schema_address_street', '', 'text', 'advanced_seo', 'Schema: Strasse', 'Strasse und Hausnummer'),
('schema_address_city', '', 'text', 'advanced_seo', 'Schema: Stadt', 'Stadt/Ort'),
('schema_address_region', '', 'text', 'advanced_seo', 'Schema: Kanton', 'Kanton/Region'),
('schema_address_postal', '', 'text', 'advanced_seo', 'Schema: PLZ', 'Postleitzahl'),
('schema_address_country', 'CH', 'text', 'advanced_seo', 'Schema: Land', 'Ländercode'),

-- Schema.org Social Media (für sameAs - wichtig!)
('schema_social_facebook', '', 'url', 'advanced_seo', 'Social: Facebook URL', 'Facebook Seiten-URL'),
('schema_social_twitter', '', 'url', 'advanced_seo', 'Social: Twitter URL', 'Twitter/X Profil-URL'),
('schema_social_instagram', '', 'url', 'advanced_seo', 'Social: Instagram URL', 'Instagram Profil-URL'),
('schema_social_linkedin', '', 'url', 'advanced_seo', 'Social: LinkedIn URL', 'LinkedIn Seiten-URL'),
('schema_social_youtube', '', 'url', 'advanced_seo', 'Social: YouTube URL', 'YouTube Kanal-URL')
ON CONFLICT (key) DO NOTHING;