-- Update design colors in site_settings to match new premium color scheme
UPDATE site_settings 
SET value = '0 60% 25%' 
WHERE key = 'design_primary_color';

UPDATE site_settings 
SET value = '30 25% 85%' 
WHERE key = 'design_secondary_color';

UPDATE site_settings 
SET value = '45 85% 55%' 
WHERE key = 'design_accent_color';