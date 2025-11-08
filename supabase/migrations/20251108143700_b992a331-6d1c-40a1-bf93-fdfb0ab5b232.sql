-- First, drop the old category check constraint
ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_category_check;

-- Add new check constraint with all categories including new ones
ALTER TABLE site_settings ADD CONSTRAINT site_settings_category_check 
CHECK (category IN ('content', 'design', 'seo', 'navigation', 'tracking', 'schema', 'indexing', 'social', 'advanced_seo'));

-- Insert new SEO settings for tracking category
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('google_analytics_id', '', 'text', 'tracking', 'Google Analytics ID', 'GA4 Measurement ID (z.B. G-XXXXXXXXXX)'),
('google_tag_manager_id', '', 'text', 'tracking', 'Google Tag Manager ID', 'GTM Container ID (z.B. GTM-XXXXXXX)'),
('facebook_pixel_id', '', 'text', 'tracking', 'Facebook Pixel ID', 'Facebook Pixel ID für Tracking'),
('google_site_verification', '', 'text', 'tracking', 'Google Site Verification', 'Google Search Console Verification Code'),
('bing_site_verification', '', 'text', 'tracking', 'Bing Site Verification', 'Bing Webmaster Tools Verification Code'),
('yandex_verification', '', 'text', 'tracking', 'Yandex Verification', 'Yandex Webmaster Verification Code');

-- Insert new SEO settings for schema category
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('schema_org_name', 'ESCORIA', 'text', 'schema', 'Organization Name', 'Name der Organisation für Schema.org'),
('schema_org_logo', '', 'url', 'schema', 'Organization Logo URL', 'Logo URL für Schema.org'),
('schema_org_url', '', 'url', 'schema', 'Organization URL', 'Haupt-URL der Organisation'),
('schema_contact_type', 'customer service', 'text', 'schema', 'Contact Type', 'Art des Kontakts (z.B. customer service)'),
('schema_contact_phone', '', 'text', 'schema', 'Contact Phone', 'Telefonnummer für Schema.org'),
('schema_contact_email', '', 'text', 'schema', 'Contact Email', 'E-Mail für Schema.org'),
('schema_address_street', '', 'text', 'schema', 'Street Address', 'Straße und Hausnummer'),
('schema_address_city', '', 'text', 'schema', 'City', 'Stadt'),
('schema_address_region', '', 'text', 'schema', 'Region/State', 'Region oder Bundesland'),
('schema_address_postal', '', 'text', 'schema', 'Postal Code', 'Postleitzahl'),
('schema_address_country', 'CH', 'text', 'schema', 'Country', 'Ländercode (z.B. CH, DE)'),
('schema_social_facebook', '', 'url', 'schema', 'Facebook URL', 'Facebook Seiten-URL'),
('schema_social_twitter', '', 'url', 'schema', 'Twitter/X URL', 'Twitter/X Profil-URL'),
('schema_social_instagram', '', 'url', 'schema', 'Instagram URL', 'Instagram Profil-URL'),
('schema_social_linkedin', '', 'url', 'schema', 'LinkedIn URL', 'LinkedIn Seiten-URL'),
('schema_social_youtube', '', 'url', 'schema', 'YouTube URL', 'YouTube Kanal-URL');

-- Insert new SEO settings for indexing category
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('sitemap_enabled', 'true', 'boolean', 'indexing', 'Sitemap aktiviert', 'XML Sitemap generieren'),
('robots_txt_enabled', 'true', 'boolean', 'indexing', 'Robots.txt aktiviert', 'Robots.txt bereitstellen'),
('noindex_pages', '', 'textarea', 'indexing', 'Noindex Pages', 'Seiten die nicht indexiert werden sollen (eine pro Zeile)'),
('crawl_delay', '0', 'text', 'indexing', 'Crawl Delay', 'Verzögerung zwischen Crawls in Sekunden (0 = keine)');

-- Insert new SEO settings for social category
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('og_site_name', 'ESCORIA', 'text', 'social', 'OG Site Name', 'Open Graph Site Name'),
('og_locale', 'de_CH', 'text', 'social', 'OG Locale', 'Open Graph Locale (z.B. de_CH, de_DE)'),
('twitter_card_type', 'summary_large_image', 'text', 'social', 'Twitter Card Type', 'Twitter Card Type (summary_large_image oder summary)'),
('linkedin_partner_id', '', 'text', 'social', 'LinkedIn Partner ID', 'LinkedIn Partner ID für Conversion Tracking');

-- Insert new SEO settings for advanced_seo category
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('breadcrumbs_enabled', 'true', 'boolean', 'advanced_seo', 'Breadcrumbs aktiviert', 'Breadcrumb Navigation aktivieren'),
('breadcrumbs_home_label', 'Home', 'text', 'advanced_seo', 'Breadcrumbs Home Label', 'Label für Home Link'),
('hreflang_enabled', 'false', 'boolean', 'advanced_seo', 'Hreflang aktiviert', 'Hreflang Tags für mehrsprachige Seiten'),
('rich_snippets_enabled', 'true', 'boolean', 'advanced_seo', 'Rich Snippets aktiviert', 'Strukturierte Daten für Rich Snippets');