import { Helmet } from 'react-helmet-async';
import { useSiteSetting } from '@/hooks/useSiteSettings';

interface SchemaOrgProps {
  type?: 'Organization' | 'LocalBusiness' | 'WebSite' | 'Person';
  additionalData?: Record<string, any>;
}

export const SchemaOrg = ({ type = 'Organization', additionalData }: SchemaOrgProps) => {
  const { data: orgName } = useSiteSetting('schema_organization_name');
  const { data: orgLogo } = useSiteSetting('schema_organization_logo');
  const { data: orgUrl } = useSiteSetting('schema_organization_url');
  const { data: contactType } = useSiteSetting('schema_contact_type');
  const { data: telephone } = useSiteSetting('schema_contact_telephone');
  const { data: email } = useSiteSetting('schema_contact_email');
  const { data: street } = useSiteSetting('schema_address_street');
  const { data: city } = useSiteSetting('schema_address_city');
  const { data: postal } = useSiteSetting('schema_address_postal');
  const { data: country } = useSiteSetting('schema_address_country');
  const { data: facebook } = useSiteSetting('schema_social_facebook');
  const { data: twitter } = useSiteSetting('schema_social_twitter');
  const { data: instagram } = useSiteSetting('schema_social_instagram');
  const { data: linkedin } = useSiteSetting('schema_social_linkedin');

  const socialUrls = [facebook, twitter, instagram, linkedin].filter(Boolean);

  const baseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': type,
    name: orgName || 'ESCORIA',
    url: orgUrl || window.location.origin,
    logo: orgLogo || `${window.location.origin}/placeholder.svg`,
    ...additionalData,
  };

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
  if (street || city || postal || country) {
    baseSchema.address = {
      '@type': 'PostalAddress',
      ...(street && { streetAddress: street }),
      ...(city && { addressLocality: city }),
      ...(postal && { postalCode: postal }),
      ...(country && { addressCountry: country }),
    };
  }

  // Add social media URLs
  if (socialUrls.length > 0) {
    baseSchema.sameAs = socialUrls;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(baseSchema)}
      </script>
    </Helmet>
  );
};
