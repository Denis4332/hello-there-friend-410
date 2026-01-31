-- Erst den alten CHECK constraint entfernen
ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_category_check;

-- Neuen CHECK constraint mit allen benötigten Kategorien hinzufügen
ALTER TABLE site_settings ADD CONSTRAINT site_settings_category_check 
CHECK (category IN ('content', 'design', 'legal', 'messages', 'navigation', 'schema', 'seo', 'tracking', 'dashboard', 'search', 'auth', 'contact', 'profile', 'config', 'advanced', 'listings'));