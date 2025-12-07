import { Helmet } from 'react-helmet-async';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

interface SchemaOrgProps {
  type?: 'Organization' | 'LocalBusiness' | 'WebSite' | 'Person';
  additionalData?: Record<string, any>;
}

export const SchemaOrg = ({ type, additionalData }: SchemaOrgProps) => {
  const { getSetting } = useSiteSettingsContext();

  const schemaType = getSetting('schema_org_type');
  const orgName = getSetting('schema_org_name');
  const orgDescription = getSetting('schema_org_description');
  const orgLogo = getSetting('schema_org_logo');
  const orgUrl = getSetting('schema_org_url');
  const contactType = getSetting('schema_contact_type');
  const telephone = getSetting('schema_contact_phone');
  const email = getSetting('schema_contact_email');
  const street = getSetting('schema_address_street');
  const city = getSetting('schema_address_city');
  const region = getSetting('schema_address_region');
  const postal = getSetting('schema_address_postal');
  const country = getSetting('schema_address_country');
  const facebook = getSetting('schema_social_facebook');
  const twitter = getSetting('schema_social_twitter');
  const instagram = getSetting('schema_social_instagram');
  const linkedin = getSetting('schema_social_linkedin');
  const youtube = getSetting('schema_social_youtube');
  const sameAsRaw = getSetting('schema_org_same_as');

  // Collect social URLs from individual settings
  const socialUrls = [facebook, twitter, instagram, linkedin, youtube].filter(Boolean);
  
  // Also parse the sameAs field (newline-separated URLs)
  if (sameAsRaw) {
    const additionalUrls = sameAsRaw.split('\n').map(url => url.trim()).filter(Boolean);
    socialUrls.push(...additionalUrls);
  }

  // Use prop type first, then CMS setting, then default
  const finalType = type || schemaType || 'Organization';

  const baseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': finalType,
    name: orgName || 'ESCORIA',
    url: orgUrl || window.location.origin,
    logo: orgLogo || `${window.location.origin}/placeholder.svg`,
    ...additionalData,
  };

  // Add description if available
  if (orgDescription) {
    baseSchema.description = orgDescription;
  }

  // Add contact point if we have contact info
  if (telephone || email) {
    baseSchema.contactPoint = {
      '@type': 'ContactPoint',
      contactType: contactType || 'customer service',
      ...(telephone && { telephone }),
      ...(email && { email }),
    };
  }

  // Add address if we have address info
  if (street || city || region || postal || country) {
    baseSchema.address = {
      '@type': 'PostalAddress',
      ...(street && { streetAddress: street }),
      ...(city && { addressLocality: city }),
      ...(region && { addressRegion: region }),
      ...(postal && { postalCode: postal }),
      ...(country && { addressCountry: country }),
    };
  }

  // Add social media URLs (deduplicated)
  const uniqueSocialUrls = [...new Set(socialUrls)];
  if (uniqueSocialUrls.length > 0) {
    baseSchema.sameAs = uniqueSocialUrls;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(baseSchema)}
      </script>
    </Helmet>
  );
};