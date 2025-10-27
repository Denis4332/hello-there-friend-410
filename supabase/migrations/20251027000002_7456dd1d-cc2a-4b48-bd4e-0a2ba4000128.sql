-- Phase 3: Startseite CMS-fähig machen
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
  ('home_top_cities_title', 'Top-Städte', 'text', 'content', 'Titel "Top-Städte"', 'Überschrift für Top-Städte-Sektion auf Startseite'),
  ('home_featured_profiles_title', 'Aktuelle Profile', 'text', 'content', 'Titel "Aktuelle Profile"', 'Überschrift für Featured-Profile-Sektion'),
  ('home_loading_cities_text', 'Lade Städte...', 'text', 'content', 'Ladetext Städte', 'Text während Städte geladen werden'),
  ('home_loading_profiles_text', 'Lade Profile...', 'text', 'content', 'Ladetext Profile', 'Text während Profile geladen werden'),
  ('home_no_cities_text', 'Keine Städte verfügbar', 'text', 'content', 'Leerzustand Städte', 'Text wenn keine Städte vorhanden'),
  ('home_no_profiles_text', 'Keine Profile verfügbar', 'text', 'content', 'Leerzustand Profile', 'Text wenn keine Profile vorhanden')
ON CONFLICT (key) DO NOTHING;