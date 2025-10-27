-- =====================================================
-- PHASE 1: KRITISCHE MIGRATION
-- =====================================================

-- 1. CREATE dropdown_options TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dropdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category, value)
);

-- Enable RLS
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active dropdown options"
ON public.dropdown_options
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage dropdown options"
ON public.dropdown_options
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dropdown_options_category ON public.dropdown_options(category);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_active ON public.dropdown_options(active);

-- 2. INSERT INITIAL DROPDOWN DATA
-- =====================================================

-- Languages (Sprachen)
INSERT INTO public.dropdown_options (category, value, label, sort_order) VALUES
('languages', 'de', 'Deutsch', 1),
('languages', 'en', 'Englisch', 2),
('languages', 'fr', 'Französisch', 3),
('languages', 'it', 'Italienisch', 4),
('languages', 'es', 'Spanisch', 5),
('languages', 'pt', 'Portugiesisch', 6),
('languages', 'ru', 'Russisch', 7),
('languages', 'ar', 'Arabisch', 8),
('languages', 'zh', 'Chinesisch', 9),
('languages', 'ja', 'Japanisch', 10)
ON CONFLICT (category, value) DO NOTHING;

-- Genders (Geschlechter)
INSERT INTO public.dropdown_options (category, value, label, sort_order) VALUES
('genders', 'female', 'Weiblich', 1),
('genders', 'male', 'Männlich', 2),
('genders', 'non-binary', 'Nicht-binär', 3),
('genders', 'diverse', 'Divers', 4),
('genders', 'prefer-not-to-say', 'Keine Angabe', 5)
ON CONFLICT (category, value) DO NOTHING;

-- Radius Options (Umkreis)
INSERT INTO public.dropdown_options (category, value, label, sort_order) VALUES
('radius', '5', '5 km', 1),
('radius', '10', '10 km', 2),
('radius', '20', '20 km', 3),
('radius', '50', '50 km', 4),
('radius', '100', '100 km', 5),
('radius', '200', '200 km', 6),
('radius', 'all', 'Ganze Schweiz', 7)
ON CONFLICT (category, value) DO NOTHING;

-- Report Reasons (Meldegründe)
INSERT INTO public.dropdown_options (category, value, label, sort_order) VALUES
('report_reasons', 'fake', 'Fake-Profil', 1),
('report_reasons', 'inappropriate', 'Unangemessene Inhalte', 2),
('report_reasons', 'spam', 'Spam', 3),
('report_reasons', 'harassment', 'Belästigung', 4),
('report_reasons', 'underage', 'Minderjährig', 5),
('report_reasons', 'scam', 'Betrug', 6),
('report_reasons', 'duplicate', 'Duplikat', 7),
('report_reasons', 'other', 'Sonstiges', 8)
ON CONFLICT (category, value) DO NOTHING;

-- 3. CREATE site-assets STORAGE BUCKET
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for site-assets bucket
CREATE POLICY "Public can view site assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. INSERT 100+ site_settings KEYS
-- =====================================================

-- NAVIGATION (15 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('nav_home', 'Home', 'text', 'navigation', 'Navigation: Home', 'Text für Home-Link'),
('nav_cities', 'Städte', 'text', 'navigation', 'Navigation: Städte', 'Text für Städte-Link'),
('nav_categories', 'Kategorien', 'text', 'navigation', 'Navigation: Kategorien', 'Text für Kategorien-Link'),
('nav_search', 'Suche', 'text', 'navigation', 'Navigation: Suche', 'Text für Suche-Link'),
('nav_login', 'Anmelden', 'text', 'navigation', 'Navigation: Anmelden', 'Text für Login-Link'),
('nav_register', 'Registrieren', 'text', 'navigation', 'Navigation: Registrieren', 'Text für Registrieren-Link'),
('nav_dashboard', 'Dashboard', 'text', 'navigation', 'Navigation: Dashboard', 'Text für Dashboard-Link'),
('nav_profile_create', 'Inserat erstellen', 'text', 'navigation', 'Navigation: Inserat erstellen', 'Text für Profil erstellen'),
('nav_logout', 'Abmelden', 'text', 'navigation', 'Navigation: Abmelden', 'Text für Logout-Link'),
('nav_logo_text', 'SwissConnect', 'text', 'navigation', 'Logo Text', 'Text neben Logo (falls kein Image)'),
('nav_logo_url', '', 'image', 'navigation', 'Logo URL', 'URL zum Logo-Bild'),
('nav_show_search', 'true', 'boolean', 'navigation', 'Suche im Header anzeigen', 'Zeigt Suchfeld im Header'),
('nav_sticky', 'true', 'boolean', 'navigation', 'Sticky Navigation', 'Header bleibt beim Scrollen sichtbar'),
('nav_cta_text', 'Jetzt inserieren', 'text', 'navigation', 'CTA Button Text', 'Text für Call-to-Action Button'),
('nav_cta_link', '/profil/erstellen', 'text', 'navigation', 'CTA Button Link', 'Link für Call-to-Action Button')
ON CONFLICT (key) DO NOTHING;

-- FOOTER (10 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('footer_copyright', '© 2024 SwissConnect. Alle Rechte vorbehalten.', 'text', 'content', 'Footer: Copyright Text', 'Copyright-Text im Footer'),
('footer_description', 'Die führende Plattform für Kontakte in der Schweiz', 'textarea', 'content', 'Footer: Beschreibung', 'Kurze Beschreibung im Footer'),
('footer_social_facebook', '', 'url', 'content', 'Footer: Facebook URL', 'Facebook Profil-URL'),
('footer_social_instagram', '', 'url', 'content', 'Footer: Instagram URL', 'Instagram Profil-URL'),
('footer_social_twitter', '', 'url', 'content', 'Footer: Twitter URL', 'Twitter Profil-URL'),
('footer_social_linkedin', '', 'url', 'content', 'Footer: LinkedIn URL', 'LinkedIn Profil-URL'),
('footer_link_agb', '/agb', 'text', 'content', 'Footer: AGB Link', 'Link zu AGB'),
('footer_link_datenschutz', '/datenschutz', 'text', 'content', 'Footer: Datenschutz Link', 'Link zu Datenschutz'),
('footer_link_kontakt', '/kontakt', 'text', 'content', 'Footer: Kontakt Link', 'Link zu Kontakt'),
('footer_show_social', 'true', 'boolean', 'content', 'Footer: Social Links anzeigen', 'Zeigt Social Media Icons')
ON CONFLICT (key) DO NOTHING;

-- AUTH (12 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('auth_login_title', 'Willkommen zurück', 'text', 'content', 'Login: Titel', 'Titel auf Login-Seite'),
('auth_login_subtitle', 'Melde dich an, um fortzufahren', 'text', 'content', 'Login: Untertitel', 'Untertitel auf Login-Seite'),
('auth_register_title', 'Konto erstellen', 'text', 'content', 'Registrierung: Titel', 'Titel auf Registrierungs-Seite'),
('auth_register_subtitle', 'Erstelle ein Konto und starte durch', 'text', 'content', 'Registrierung: Untertitel', 'Untertitel auf Registrierungs-Seite'),
('auth_email_placeholder', 'E-Mail-Adresse', 'text', 'content', 'Auth: Email Placeholder', 'Platzhalter für Email-Feld'),
('auth_password_placeholder', 'Passwort', 'text', 'content', 'Auth: Passwort Placeholder', 'Platzhalter für Passwort-Feld'),
('auth_login_button', 'Anmelden', 'text', 'content', 'Auth: Login Button', 'Text für Login-Button'),
('auth_register_button', 'Registrieren', 'text', 'content', 'Auth: Registrieren Button', 'Text für Registrieren-Button'),
('auth_forgot_password', 'Passwort vergessen?', 'text', 'content', 'Auth: Passwort vergessen Link', 'Text für Passwort vergessen'),
('auth_no_account', 'Noch kein Konto?', 'text', 'content', 'Auth: Kein Konto Text', 'Text vor Registrieren-Link'),
('auth_have_account', 'Bereits ein Konto?', 'text', 'content', 'Auth: Konto vorhanden Text', 'Text vor Login-Link'),
('auth_terms_text', 'Mit der Registrierung akzeptierst du unsere AGB und Datenschutzerklärung', 'textarea', 'content', 'Auth: AGB Hinweis', 'Hinweis zu AGB/Datenschutz')
ON CONFLICT (key) DO NOTHING;

-- DASHBOARD (8 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('dashboard_welcome_title', 'Willkommen zurück!', 'text', 'content', 'Dashboard: Willkommen Titel', 'Titel im Dashboard'),
('dashboard_welcome_text', 'Verwalte deine Profile und Einstellungen', 'textarea', 'content', 'Dashboard: Willkommen Text', 'Text im Dashboard'),
('dashboard_create_profile_text', 'Inserat erstellen', 'text', 'content', 'Dashboard: Inserat erstellen Button', 'Button-Text für neues Inserat'),
('dashboard_my_profiles_text', 'Meine Inserate', 'text', 'content', 'Dashboard: Meine Inserate', 'Titel für Inserate-Liste'),
('dashboard_edit_profile_text', 'Bearbeiten', 'text', 'content', 'Dashboard: Bearbeiten Button', 'Button-Text zum Bearbeiten'),
('dashboard_delete_profile_text', 'Löschen', 'text', 'content', 'Dashboard: Löschen Button', 'Button-Text zum Löschen'),
('dashboard_no_profiles_text', 'Du hast noch keine Inserate erstellt', 'text', 'content', 'Dashboard: Keine Inserate', 'Text wenn keine Inserate vorhanden'),
('dashboard_profile_status_pending', 'Wird geprüft', 'text', 'content', 'Dashboard: Status Pending', 'Text für Status "pending"')
ON CONFLICT (key) DO NOTHING;

-- CONTACT (8 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('contact_title', 'Kontakt', 'text', 'content', 'Kontakt: Titel', 'Titel der Kontakt-Seite'),
('contact_subtitle', 'Hast du Fragen? Schreib uns!', 'text', 'content', 'Kontakt: Untertitel', 'Untertitel der Kontakt-Seite'),
('contact_name_label', 'Name', 'text', 'content', 'Kontakt: Name Label', 'Label für Name-Feld'),
('contact_email_label', 'E-Mail', 'text', 'content', 'Kontakt: Email Label', 'Label für Email-Feld'),
('contact_message_label', 'Nachricht', 'text', 'content', 'Kontakt: Nachricht Label', 'Label für Nachricht-Feld'),
('contact_submit_button', 'Absenden', 'text', 'content', 'Kontakt: Submit Button', 'Text für Absenden-Button'),
('contact_success_message', 'Vielen Dank! Wir melden uns bald.', 'text', 'content', 'Kontakt: Erfolgs-Nachricht', 'Nachricht nach erfolgreichem Absenden'),
('contact_email_address', 'kontakt@swissconnect.ch', 'text', 'content', 'Kontakt: E-Mail-Adresse', 'Kontakt E-Mail-Adresse (wird angezeigt)')
ON CONFLICT (key) DO NOTHING;

-- PROFILE CREATE (10 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('profile_create_title', 'Inserat erstellen', 'text', 'content', 'Profil erstellen: Titel', 'Titel auf Profil-Erstellen-Seite'),
('profile_create_subtitle', 'Erstelle dein persönliches Inserat in wenigen Schritten', 'textarea', 'content', 'Profil erstellen: Untertitel', 'Untertitel auf Profil-Erstellen-Seite'),
('profile_create_step1_title', 'Grunddaten', 'text', 'content', 'Profil erstellen: Schritt 1 Titel', 'Titel für Schritt 1'),
('profile_create_step2_title', 'Fotos hochladen', 'text', 'content', 'Profil erstellen: Schritt 2 Titel', 'Titel für Schritt 2'),
('profile_create_button_text', 'Weiter zu Fotos', 'text', 'content', 'Profil erstellen: Weiter Button', 'Button-Text nach Formular'),
('profile_create_photo_min', '1', 'text', 'content', 'Profil erstellen: Min. Fotos', 'Mindestanzahl Fotos'),
('profile_create_photo_max', '5', 'text', 'content', 'Profil erstellen: Max. Fotos', 'Maximalanzahl Fotos (Standard-User)'),
('profile_create_photo_help', 'Lade mindestens 1 Foto hoch. Max. 5 MB pro Bild.', 'textarea', 'content', 'Profil erstellen: Foto Hilfe', 'Hilfetext beim Foto-Upload'),
('profile_create_submit_text', 'Inserat einreichen', 'text', 'content', 'Profil erstellen: Submit Button', 'Button-Text zum Einreichen'),
('profile_create_success_text', 'Dein Inserat wurde eingereicht und wird geprüft!', 'textarea', 'content', 'Profil erstellen: Erfolg', 'Erfolgs-Nachricht nach Einreichen')
ON CONFLICT (key) DO NOTHING;

-- PROFILE EDIT (10 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('profile_edit_title', 'Inserat bearbeiten', 'text', 'content', 'Profil bearbeiten: Titel', 'Titel auf Profil-Bearbeiten-Seite'),
('profile_edit_subtitle', 'Aktualisiere deine Angaben', 'text', 'content', 'Profil bearbeiten: Untertitel', 'Untertitel auf Profil-Bearbeiten-Seite'),
('profile_edit_save_button', 'Änderungen speichern', 'text', 'content', 'Profil bearbeiten: Speichern Button', 'Button-Text zum Speichern'),
('profile_edit_cancel_button', 'Abbrechen', 'text', 'content', 'Profil bearbeiten: Abbrechen Button', 'Button-Text zum Abbrechen'),
('profile_edit_delete_button', 'Inserat löschen', 'text', 'content', 'Profil bearbeiten: Löschen Button', 'Button-Text zum Löschen'),
('profile_edit_delete_confirm', 'Möchtest du dieses Inserat wirklich löschen?', 'text', 'content', 'Profil bearbeiten: Lösch-Bestätigung', 'Bestätigungstext beim Löschen'),
('profile_edit_photo_change', 'Foto ändern', 'text', 'content', 'Profil bearbeiten: Foto ändern', 'Button-Text zum Foto ändern'),
('profile_edit_photo_delete', 'Foto löschen', 'text', 'content', 'Profil bearbeiten: Foto löschen', 'Button-Text zum Foto löschen'),
('profile_edit_success', 'Profil erfolgreich aktualisiert!', 'text', 'content', 'Profil bearbeiten: Erfolg', 'Erfolgs-Nachricht'),
('profile_edit_resubmit_text', 'Bei größeren Änderungen muss dein Profil erneut geprüft werden.', 'textarea', 'content', 'Profil bearbeiten: Erneute Prüfung', 'Hinweis bei Status-Änderung zu "pending"')
ON CONFLICT (key) DO NOTHING;

-- SEARCH (8 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('search_title', 'Suche', 'text', 'content', 'Suche: Titel', 'Titel der Suche-Seite'),
('search_subtitle', 'Finde das perfekte Inserat', 'text', 'content', 'Suche: Untertitel', 'Untertitel der Suche-Seite'),
('search_location_placeholder', 'Stadt oder PLZ', 'text', 'content', 'Suche: Ort Placeholder', 'Platzhalter für Ort-Feld'),
('search_radius_label', 'Umkreis', 'text', 'content', 'Suche: Umkreis Label', 'Label für Umkreis-Dropdown'),
('search_category_label', 'Kategorie', 'text', 'content', 'Suche: Kategorie Label', 'Label für Kategorie-Dropdown'),
('search_button_text', 'Suchen', 'text', 'content', 'Suche: Button Text', 'Text für Such-Button'),
('search_reset_button', 'Filter zurücksetzen', 'text', 'content', 'Suche: Reset Button', 'Text für Reset-Button'),
('search_no_results', 'Keine Inserate gefunden. Versuche es mit anderen Suchkriterien.', 'textarea', 'content', 'Suche: Keine Ergebnisse', 'Text wenn keine Ergebnisse')
ON CONFLICT (key) DO NOTHING;

-- CONFIG (5 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('config_upload_max_file_size_mb', '5', 'text', 'content', 'Config: Max. Dateigröße (MB)', 'Maximale Dateigröße für Uploads in MB'),
('config_upload_max_photos_per_profile', '5', 'text', 'content', 'Config: Max. Fotos pro Profil', 'Standard-User max. Fotos'),
('config_upload_max_photos_premium', '20', 'text', 'content', 'Config: Max. Fotos Premium', 'Premium-User max. Fotos'),
('config_profile_approval_required', 'true', 'boolean', 'content', 'Config: Profil-Freigabe erforderlich', 'Neue Profile müssen freigegeben werden'),
('config_allow_self_registration', 'true', 'boolean', 'content', 'Config: Selbst-Registrierung erlauben', 'User können sich selbst registrieren')
ON CONFLICT (key) DO NOTHING;

-- ADVANCED (3 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('advanced_custom_css', '', 'textarea', 'content', 'Advanced: Custom CSS', 'Eigenes CSS (für Experten)'),
('advanced_custom_js', '', 'textarea', 'content', 'Advanced: Custom JavaScript', 'Eigenes JavaScript (für Experten)'),
('advanced_analytics_code', '', 'textarea', 'content', 'Advanced: Analytics Code', 'Google Analytics / Matomo Code')
ON CONFLICT (key) DO NOTHING;

-- DESIGN (5 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('design_favicon_url', '', 'image', 'design', 'Design: Favicon URL', 'URL zum Favicon (16x16 oder 32x32)'),
('design_primary_color', '#2563eb', 'color', 'design', 'Design: Primärfarbe', 'Hauptfarbe der Seite'),
('design_secondary_color', '#7c3aed', 'color', 'design', 'Design: Sekundärfarbe', 'Sekundäre Farbe'),
('design_font_family', 'Inter, sans-serif', 'text', 'design', 'Design: Schriftart', 'Haupt-Schriftart (CSS font-family)'),
('design_border_radius', '0.5rem', 'text', 'design', 'Design: Border Radius', 'Standard Border Radius (CSS)')
ON CONFLICT (key) DO NOTHING;

-- SEO META DATA (20 Keys)
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('seo_home_title', 'SwissConnect - Die führende Kontaktplattform', 'text', 'seo', 'SEO: Home Title', 'Meta Title für Startseite'),
('seo_home_description', 'Finde spannende Kontakte in der ganzen Schweiz. Verifizierte Profile, sichere Plattform.', 'textarea', 'seo', 'SEO: Home Description', 'Meta Description für Startseite'),
('seo_home_keywords', 'kontakte, schweiz, dating, inserate', 'textarea', 'seo', 'SEO: Home Keywords', 'Meta Keywords für Startseite'),
('seo_cities_title', 'Städte - SwissConnect', 'text', 'seo', 'SEO: Städte Title', 'Meta Title für Städte-Seite'),
('seo_cities_description', 'Finde Kontakte in deiner Stadt. Von Zürich bis Genf - überall in der Schweiz.', 'textarea', 'seo', 'SEO: Städte Description', 'Meta Description für Städte-Seite'),
('seo_categories_title', 'Kategorien - SwissConnect', 'text', 'seo', 'SEO: Kategorien Title', 'Meta Title für Kategorien-Seite'),
('seo_categories_description', 'Entdecke verschiedene Kategorien und finde genau was du suchst.', 'textarea', 'seo', 'SEO: Kategorien Description', 'Meta Description für Kategorien-Seite'),
('seo_search_title', 'Suche - SwissConnect', 'text', 'seo', 'SEO: Suche Title', 'Meta Title für Suche-Seite'),
('seo_search_description', 'Nutze unsere erweiterte Suche um das perfekte Inserat zu finden.', 'textarea', 'seo', 'SEO: Suche Description', 'Meta Description für Suche-Seite'),
('seo_contact_title', 'Kontakt - SwissConnect', 'text', 'seo', 'SEO: Kontakt Title', 'Meta Title für Kontakt-Seite'),
('seo_contact_description', 'Hast du Fragen? Kontaktiere uns jederzeit. Wir helfen gerne weiter.', 'textarea', 'seo', 'SEO: Kontakt Description', 'Meta Description für Kontakt-Seite'),
('seo_og_image', '', 'image', 'seo', 'SEO: Open Graph Image', 'Standard OG Image (1200x630)'),
('seo_twitter_handle', '@swissconnect', 'text', 'seo', 'SEO: Twitter Handle', 'Twitter Username'),
('seo_robots', 'index, follow', 'text', 'seo', 'SEO: Robots Meta', 'Standard Robots Meta Tag'),
('seo_canonical_base', 'https://swissconnect.ch', 'url', 'seo', 'SEO: Canonical Base URL', 'Basis-URL für Canonical Tags')
ON CONFLICT (key) DO NOTHING;

-- 5. CREATE PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON public.site_settings(category);