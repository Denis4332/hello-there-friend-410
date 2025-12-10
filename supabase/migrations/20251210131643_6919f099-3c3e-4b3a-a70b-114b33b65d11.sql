-- Phase 1: Fehlende SEO Settings hinzufügen
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('og_site_name', 'ESCORIA', 'text', 'seo', 'Open Graph: Site Name', 'Name der Website für Social Sharing'),
('og_locale', 'de_CH', 'text', 'seo', 'Open Graph: Locale', 'Sprache/Region Code (z.B. de_CH, de_DE)'),
('twitter_card_type', 'summary_large_image', 'text', 'seo', 'Twitter: Card Type', 'summary, summary_large_image, app, player'),
('facebook_app_id', '', 'text', 'tracking', 'Facebook: App ID', 'Facebook App ID für erweiterte Integration'),
('linkedin_partner_id', '', 'text', 'tracking', 'LinkedIn: Partner ID', 'LinkedIn Partner ID für Tracking'),
('schema_org_name', 'ESCORIA', 'text', 'advanced_seo', 'Schema.org: Name', 'Offizieller Name der Organisation'),
('schema_org_logo', '', 'url', 'advanced_seo', 'Schema.org: Logo URL', 'URL zum Firmenlogo (empfohlen: 112x112px)'),
('schema_org_url', 'https://escoria.ch', 'url', 'advanced_seo', 'Schema.org: Website URL', 'Offizielle Website URL')
ON CONFLICT (key) DO NOTHING;