-- Phase 2A: Fix 2 - Add missing nav_contact key
INSERT INTO site_settings (key, value, type, category, label, description)
VALUES ('nav_contact', 'Kontakt', 'text', 'navigation', 'Navigation: Kontakt-Link', 'Text für den Kontakt-Link in der Navigation');

-- Phase 2A: Fix 3 - Remove duplicate nav_logo_text (design_logo_text already exists)
DELETE FROM site_settings WHERE key = 'nav_logo_text';