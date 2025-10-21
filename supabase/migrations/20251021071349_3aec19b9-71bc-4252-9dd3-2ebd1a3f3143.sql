-- Migration 2: Core Tables for Dating Platform

-- Categories (Dating interests)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Swiss Cantons
CREATE TABLE public.cantons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL UNIQUE
);

-- Dating Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
    gender TEXT,
    city TEXT NOT NULL,
    canton TEXT NOT NULL,
    postal_code TEXT CHECK (postal_code ~ '^\d{4}$'),
    lat NUMERIC,
    lng NUMERIC,
    about_me TEXT CHECK (char_length(about_me) <= 500),
    languages TEXT[] DEFAULT '{}',
    is_premium BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profile-Categories (Many-to-Many)
CREATE TABLE public.profile_categories (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, category_id)
);

-- Profile Photos (Supabase Storage)
CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Contact Messages
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Profile Reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_lat_lng ON public.profiles(lat, lng);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_photos_profile_id ON public.photos(profile_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_profile_id ON public.reports(profile_id);

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();