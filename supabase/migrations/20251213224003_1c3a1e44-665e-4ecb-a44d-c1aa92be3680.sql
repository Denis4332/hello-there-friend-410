-- Update existing impressum settings with correct isyWeb KLG data
UPDATE public.site_settings SET value = 'isyWeb KLG' WHERE key = 'impressum_company_name';
UPDATE public.site_settings SET value = 'Schaffhauserstrasse 30
4332 Stein AG, Schweiz' WHERE key = 'impressum_address';
UPDATE public.site_settings SET value = 'info@isyweb.ch' WHERE key = 'impressum_email';
UPDATE public.site_settings SET value = '+41 76 298 59 82' WHERE key = 'impressum_phone';
UPDATE public.site_settings SET value = '' WHERE key = 'impressum_operator_note';

-- Add new impressum settings for complete legal information
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('impressum_uid', 'CHE-297.490.821', 'text', 'legal', 'UID', 'Unternehmens-Identifikationsnummer'),
('impressum_register', 'CH-400.2.612.875-1 (Handelsregisteramt Aargau)', 'text', 'legal', 'Handelsregister-Nr.', 'Handelsregisternummer'),
('impressum_representation', 'gemäss Handelsregistereintrag', 'text', 'legal', 'Vertretung', 'Vertretungsangabe'),
('impressum_website_purpose', 'escoria.ch ist eine Inserate-Plattform. Verträge kommen ausschliesslich zwischen Inserenten und Besuchern zustande. Für Inhalte der Inserate sind die jeweiligen Inserenten verantwortlich (siehe AGB & Datenschutzerklärung).', 'textarea', 'legal', 'Zweck der Website', 'Beschreibung des Website-Zwecks'),
('impressum_hosting_info', '<p><strong>Webhosting & CDN:</strong> Netlify</p><p><strong>Datenbank/Storage:</strong> Supabase</p>', 'textarea', 'legal', 'Hosting / Technischer Betrieb', 'Technische Hosting-Informationen'),
('impressum_copyright_liability', 'Eigene Inhalte/Layout urheberrechtlich geschützt. Keine Haftung für Inhalte externer Links.', 'textarea', 'legal', 'Urheberrecht & Haftung', 'Urheberrechts- und Haftungshinweis')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;