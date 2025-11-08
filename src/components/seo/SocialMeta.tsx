import { Helmet } from 'react-helmet-async';
import { useSiteSetting } from '@/hooks/useSiteSettings';

interface SocialMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export const SocialMeta = ({ title, description, image, url }: SocialMetaProps) => {
  const { data: siteName } = useSiteSetting('og_site_name');
  const { data: locale } = useSiteSetting('og_locale');
  const { data: twitterCardType } = useSiteSetting('twitter_card_type');
  const { data: fbAppId } = useSiteSetting('facebook_app_id');
  const { data: linkedinId } = useSiteSetting('linkedin_partner_id');

  const currentUrl = url || window.location.href;
  const ogImage = image || `${window.location.origin}/placeholder.svg`;

  return (
    <Helmet>
      {/* Extended Open Graph */}
      <meta property="og:site_name" content={siteName || 'ESCORIA'} />
      <meta property="og:locale" content={locale || 'de_CH'} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      
      {/* Facebook App ID */}
      {fbAppId && <meta property="fb:app_id" content={fbAppId} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCardType || 'summary_large_image'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* LinkedIn */}
      {linkedinId && <meta name="linkedin:owner" content={linkedinId} />}
    </Helmet>
  );
};
