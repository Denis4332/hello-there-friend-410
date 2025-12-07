import { Helmet } from 'react-helmet-async';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

interface SocialMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export const SocialMeta = ({ title, description, image, url }: SocialMetaProps) => {
  const { getSetting } = useSiteSettingsContext();

  const siteName = getSetting('og_site_name');
  const locale = getSetting('og_locale');
  const ogType = getSetting('og_type');
  const ogImageWidth = getSetting('og_image_width');
  const ogImageHeight = getSetting('og_image_height');
  const ogImageAlt = getSetting('og_image_alt');
  const twitterCardType = getSetting('twitter_card_type');
  const twitterSite = getSetting('twitter_site');
  const twitterCreator = getSetting('twitter_creator');
  const fbAppId = getSetting('facebook_app_id');
  const linkedinId = getSetting('linkedin_partner_id');

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
      <meta property="og:type" content={ogType || 'website'} />
      
      {/* OG Image dimensions */}
      {ogImageWidth && <meta property="og:image:width" content={ogImageWidth} />}
      {ogImageHeight && <meta property="og:image:height" content={ogImageHeight} />}
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      
      {/* Facebook App ID */}
      {fbAppId && <meta property="fb:app_id" content={fbAppId} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCardType || 'summary_large_image'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      
      {/* LinkedIn */}
      {linkedinId && <meta name="linkedin:owner" content={linkedinId} />}
    </Helmet>
  );
};