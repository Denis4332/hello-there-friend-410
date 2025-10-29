-- Insert upload settings into site_settings table
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('upload_max_file_size_mb', '5', 'text', 'content', 'Max. Dateigröße (MB)', 'Maximale Dateigröße für Foto-Uploads in MB'),
('upload_max_photos_per_profile', '10', 'text', 'content', 'Max. Fotos pro Profil', 'Maximale Anzahl Fotos die ein Profil haben kann'),
('upload_allowed_formats', 'image/jpeg,image/png,image/webp', 'text', 'content', 'Erlaubte Formate', 'Komma-getrennte Liste erlaubter MIME-Types')
ON CONFLICT (key) DO NOTHING;