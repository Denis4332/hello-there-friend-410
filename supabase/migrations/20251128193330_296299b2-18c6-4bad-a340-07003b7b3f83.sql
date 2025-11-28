-- Add GitHub repository URL setting (using 'navigation' category)
INSERT INTO public.site_settings (key, value, type, category, label, description)
VALUES (
  'config_github_repo_url',
  '',
  'url',
  'navigation',
  'GitHub Repository URL',
  'URL zum GitHub-Repository für Export-Funktionen (z.B. https://github.com/username/repo)'
)
ON CONFLICT (key) DO NOTHING;