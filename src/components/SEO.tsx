import { Helmet } from 'react-helmet-async';
import { useSiteSetting } from '@/hooks/useSiteSettings';
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
  const { data: siteName } = useSiteSetting('site_name');
  const { data: author } = useSiteSetting('seo_author');
  const { data: publisher } = useSiteSetting('seo_publisher');
  const { data: copyright } = useSiteSetting('seo_copyright');
  const { data: contentLang } = useSiteSetting('seo_content_language');
  const { data: geoRegion } = useSiteSetting('seo_geo_region');
  const { data: geoPlace } = useSiteSetting('seo_geo_placename');
  const { data: geoPosition } = useSiteSetting('seo_geo_position');
  const { data: canonicalBase } = useSiteSetting('seo_canonical_base');
  const { data: noindexPages } = useSiteSetting('noindex_pages');
  const { data: globalKeywords } = useSiteSetting('meta_keywords');
  
  const fullTitle = `${title} | ${siteName || 'ESCORIA'}`;
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