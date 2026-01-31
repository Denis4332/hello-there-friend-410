import { Helmet } from 'react-helmet-async';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { SchemaOrg } from './seo/SchemaOrg';
import { Tracking } from './seo/Tracking';
import { SocialMeta } from './seo/SocialMeta';
import { HreflangTags } from './seo/HreflangTags';
import { ImageMetaTags } from './seo/ImageMetaTags';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'profile' | 'article';
  schemaType?: 'Organization' | 'LocalBusiness' | 'WebSite' | 'Person';
  keywords?: string;
}

export const SEO = ({ 
  title, 
  description, 
  image = 'https://escoria.ch/placeholder.svg',
  imageAlt,
  url,
  type = 'website',
  schemaType,
  keywords
}: SEOProps) => {
  // Single batch load instead of 11 individual API calls
  const { getSetting } = useSiteSettingsContext();
  
  const siteName = getSetting('site_name', 'ESCORIA');
  const author = getSetting('seo_author');
  const publisher = getSetting('seo_publisher');
  const copyright = getSetting('seo_copyright');
  const contentLang = getSetting('seo_content_language');
  const geoRegion = getSetting('seo_geo_region');
  const geoPlace = getSetting('seo_geo_placename');
  const geoPosition = getSetting('seo_geo_position');
  const canonicalBase = getSetting('seo_canonical_base');
  const noindexPages = getSetting('noindex_pages');
  const globalKeywords = getSetting('meta_keywords');
  const faviconUrl = getSetting('design_favicon_url');
  
  const fullTitle = `${title} | ${siteName}`;
  const currentUrl = url || window.location.href;
  const isNoIndex = noindexPages?.split(',').some(page => currentUrl.includes(page.trim()));
  
  // Truncate description if too long (max 160 characters for SEO)
  const metaDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;
  
  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={metaDescription} />
        
        {/* Keywords */}
        {(keywords || globalKeywords) && (
          <meta name="keywords" content={keywords || globalKeywords} />
        )}
        
        {/* Extended Meta Tags */}
        {author && <meta name="author" content={author} />}
        {publisher && <meta name="publisher" content={publisher} />}
        {copyright && <meta name="copyright" content={copyright} />}
        {contentLang && <meta httpEquiv="content-language" content={contentLang} />}
        
        {/* Geo Meta Tags */}
        {geoRegion && <meta name="geo.region" content={geoRegion} />}
        {geoPlace && <meta name="geo.placename" content={geoPlace} />}
        {geoPosition && <meta name="geo.position" content={geoPosition} />}
        {geoPosition && <meta name="ICBM" content={geoPosition} />}
        
        {/* Robots Meta */}
        {isNoIndex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow" />
        )}
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalBase ? `${canonicalBase}${new URL(currentUrl).pathname}` : currentUrl} />
        
        {/* Dynamic Favicon */}
        {faviconUrl && <link rel="icon" type="image/png" href={faviconUrl} />}
        {faviconUrl && <link rel="apple-touch-icon" href={faviconUrl} />}
      </Helmet>
      
      {/* Tracking Scripts */}
      <Tracking />
      
      {/* Social Meta Tags */}
      <SocialMeta 
        title={fullTitle}
        description={metaDescription}
        image={image}
        url={currentUrl}
      />
      
      {/* Enhanced Image Meta Tags */}
      {image && (
        <ImageMetaTags 
          url={image} 
          alt={imageAlt || title} 
        />
      )}
      
      {/* Schema.org Structured Data */}
      <SchemaOrg type={schemaType} />
      
      {/* Hreflang Tags */}
      <HreflangTags currentUrl={currentUrl} />
    </>
  );
};
