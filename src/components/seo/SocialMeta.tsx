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
  const { data: ogType } = useSiteSetting('og_type');
  const { data: ogImageWidth } = useSiteSetting('og_image_width');
  const { data: ogImageHeight } = useSiteSetting('og_image_height');
  const { data: ogImageAlt } = useSiteSetting('og_image_alt');
  const { data: twitterCardType } = useSiteSetting('twitter_card_type');
  const { data: twitterSite } = useSiteSetting('twitter_site');
  const { data: twitterCreator } = useSiteSetting('twitter_creator');
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
