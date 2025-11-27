-- First, drop the existing check constraint and add new one with legal and messages categories
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_category_check;

ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_category_check 
CHECK (category IN ('content', 'design', 'seo', 'navigation', 'advanced_seo', 'indexing', 'schema', 'social', 'tracking', 'legal', 'messages'));