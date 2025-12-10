-- Move Open Graph settings to seo category where they belong
UPDATE site_settings SET category = 'seo' WHERE key IN ('og_site_name', 'og_locale', 'twitter_card_type') AND category = 'tracking';