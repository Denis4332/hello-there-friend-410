-- Fix function search path security issue for update_updated_at_column

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_cities_updated_at ON public.cities;
DROP TRIGGER IF EXISTS update_cantons_updated_at ON public.cantons;

-- Drop and recreate function with search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate all triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cantons_updated_at
  BEFORE UPDATE ON public.cantons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix function search path security issue for delete_storage_object

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_photo_delete ON public.photos;

-- Drop and recreate function with search_path
DROP FUNCTION IF EXISTS public.delete_storage_object() CASCADE;

CREATE OR REPLACE FUNCTION public.delete_storage_object()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the file from storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'photos' 
  AND name = OLD.url;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, storage;

-- Recreate trigger
CREATE TRIGGER on_photo_delete
  BEFORE DELETE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_storage_object();