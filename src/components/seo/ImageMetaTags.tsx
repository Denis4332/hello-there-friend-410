import { Helmet } from 'react-helmet-async';

interface ImageMetaTagsProps {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export const ImageMetaTags = ({ 
  url, 
  alt, 
  width = 1200, 
  height = 630 
}: ImageMetaTagsProps) => {
  // Ensure absolute URL
  const absoluteUrl = url.startsWith('http') 
    ? url 
    : `${window.location.origin}${url}`;

  return (
    <Helmet>
      {/* Open Graph Image */}
      <meta property="og:image" content={absoluteUrl} />
      <meta property="og:image:alt" content={alt} />
      <meta property="og:image:width" content={width.toString()} />
      <meta property="og:image:height" content={height.toString()} />
      <meta property="og:image:type" content="image/jpeg" />

      {/* Twitter Card Image */}
      <meta name="twitter:image" content={absoluteUrl} />
      <meta name="twitter:image:alt" content={alt} />
    </Helmet>
  );
};
