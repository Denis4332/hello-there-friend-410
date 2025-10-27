-- Create profiles for existing users without profiles
INSERT INTO public.profiles (id, user_id, display_name, age, city, canton, status)
SELECT 
  gen_random_uuid(),
  au.id,
  'Neuer Nutzer',
  18,
  'Zürich',
  'ZH',
  'pending'
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.id IS NULL;