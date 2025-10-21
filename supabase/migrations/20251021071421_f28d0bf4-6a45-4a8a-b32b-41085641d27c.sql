-- Migration 3: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cantons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- CATEGORIES: Public read, admin write
CREATE POLICY "Public can view active categories"
ON public.categories FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CANTONS: Public read, admin write
CREATE POLICY "Public can view cantons"
ON public.cantons FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cantons"
ON public.cantons FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES: Public can view active, users manage own, admins manage all
CREATE POLICY "Public can view active profiles"
ON public.profiles FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PROFILE_CATEGORIES: Public view, users manage own
CREATE POLICY "Public can view profile categories"
ON public.profile_categories FOR SELECT
USING (true);

CREATE POLICY "Users can manage own profile categories"
ON public.profile_categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = profile_categories.profile_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all profile categories"
ON public.profile_categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PHOTOS: Public view active profile photos, users manage own
CREATE POLICY "Public can view photos of active profiles"
ON public.photos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = photos.profile_id
        AND profiles.status = 'active'
    )
);

CREATE POLICY "Users can view own photos"
ON public.photos FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = photos.profile_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own photos"
ON public.photos FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = photos.profile_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own photos"
ON public.photos FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = photos.profile_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own photos"
ON public.photos FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = photos.profile_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all photos"
ON public.photos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- REPORTS: Authenticated users can create, admins can view all
CREATE POLICY "Authenticated users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CONTACT_MESSAGES: Anyone can insert, admins can view
CREATE POLICY "Anyone can insert contact messages"
ON public.contact_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix function search_path warning
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;