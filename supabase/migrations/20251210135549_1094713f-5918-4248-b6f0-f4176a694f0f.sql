-- SEO Consolidation: Delete duplicates first, then consolidate categories

-- Delete advanced_seo duplicates that already exist with correct keys in schema
DELETE FROM site_settings WHERE key = 'schema_org_address_country' AND category = 'advanced_seo';
DELETE FROM site_settings WHERE key = 'schema_org_address_locality' AND category = 'advanced_seo';
DELETE FROM site_settings WHERE key = 'schema_org_address_region' AND category = 'advanced_seo';
DELETE FROM site_settings WHERE key = 'schema_org_phone' AND category = 'advanced_seo';
DELETE FROM site_settings WHERE key = 'schema_org_email' AND category = 'advanced_seo';

-- Move schema_org_description to schema category
UPDATE site_settings SET category = 'schema' WHERE key = 'schema_org_description' AND category = 'advanced_seo';

-- Move schema_org_type and schema_org_same_as to schema category
UPDATE site_settings SET category = 'schema' WHERE key = 'schema_org_type' AND category = 'advanced_seo';
UPDATE site_settings SET category = 'schema' WHERE key = 'schema_org_same_as' AND category = 'advanced_seo';

-- Move breadcrumbs and hreflang to seo category
UPDATE site_settings SET category = 'seo' WHERE key = 'breadcrumbs_enabled' AND category = 'advanced_seo';
UPDATE site_settings SET category = 'seo' WHERE key = 'breadcrumbs_home_label' AND category = 'advanced_seo';
UPDATE site_settings SET category = 'seo' WHERE key = 'hreflang_enabled' AND category = 'advanced_seo';

-- Move geo settings to seo category
UPDATE site_settings SET category = 'seo' WHERE key LIKE 'seo_geo_%' AND category = 'advanced_seo';

-- Move sitemap settings to indexing category
UPDATE site_settings SET category = 'indexing' WHERE key LIKE 'sitemap_%' AND category = 'advanced_seo';

-- Move pinterest to tracking
UPDATE site_settings SET category = 'tracking' WHERE key = 'pinterest_verification' AND category = 'advanced_seo';

-- Add missing SEO settings
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('og_site_name', 'ESCORIA', 'text', 'seo', 'Open Graph: Site Name', 'Name der Website für Social Sharing'),
('og_locale', 'de_CH', 'text', 'seo', 'Open Graph: Locale', 'Sprache/Region Code'),
('twitter_card_type', 'summary_large_image', 'text', 'seo', 'Twitter: Card Type', 'summary, summary_large_image'),
('facebook_app_id', '', 'text', 'tracking', 'Facebook: App ID', 'Facebook App ID für erweiterte Funktionen')
ON CONFLICT (key) DO NOTHING;

-- Ensure linkedin_partner_id is in tracking
UPDATE site_settings SET category = 'tracking' WHERE key = 'linkedin_partner_id';

-- Move social category settings to tracking (consolidate)
UPDATE site_settings SET category = 'tracking' WHERE category = 'social';

-- Move indexing category settings to seo (consolidate further)
UPDATE site_settings SET category = 'seo' WHERE category = 'indexing';