-- Add footer AGB notice setting
INSERT INTO public.site_settings (key, value, type, category, label, description)
VALUES (
  'footer_agb_notice',
  'Mit der Nutzung dieser Website akzeptierst du unsere AGB und Datenschutzbestimmungen.',
  'textarea',
  'content',
  'Footer AGB-Hinweis',
  'Rechtlicher Hinweis zur automatischen AGB-Akzeptanz im Footer'
)
ON CONFLICT (key) DO NOTHING;