import { Helmet } from 'react-helmet-async';
import type { ProfileWithRelations } from '@/types/common';
import { useSiteSetting } from '@/hooks/useSiteSettings';

interface ProfileSchemaProps {
  profile: ProfileWithRelations;
}

export const ProfileSchema = ({ profile }: ProfileSchemaProps) => {
  const { data: siteName } = useSiteSetting('site_name');
  const { data: siteUrl } = useSiteSetting('seo_canonical_base');

  // Construct full Supabase URL for primary photo
  const primaryPhoto = profile.photos?.[0]?.storage_path 
    ? `https://fwatgrgbwgtueunihbwv.supabase.co/storage/v1/object/public/profile-photos/${profile.photos[0].storage_path}`
    : '';
  
  const fullAddress = profile.street_address && profile.show_street
    ? `${profile.street_address}, ${profile.postal_code || ''} ${profile.city || ''}`
    : `${profile.city || ''}, Schweiz`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.display_name,
    url: `${siteUrl || 'https://escoria.ch'}/profil/${profile.slug}`,
    image: primaryPhoto,
    ...(profile.about_me && { description: profile.about_me }),
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.city,
      addressRegion: profile.canton,
      postalCode: profile.postal_code,
      addressCountry: 'CH',
    },
    ...(profile.phone && {
      telephone: profile.phone,
    }),
    ...(profile.email && {
      email: profile.email,
    }),
    ...(profile.website && {
      sameAs: [profile.website],
    }),
    ...(profile.verified_at && {
      award: 'Verifiziertes Profil',
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
