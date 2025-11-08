import { Helmet } from 'react-helmet-async';
import { useSiteSetting } from '@/hooks/useSiteSettings';

interface HreflangTagsProps {
  currentUrl: string;
}

export const HreflangTags = ({ currentUrl }: HreflangTagsProps) => {
  const { data: hreflangEnabled } = useSiteSetting('hreflang_enabled');

  // Only render if hreflang is enabled
  if (hreflangEnabled !== 'true') {
    return null;
  }

  // Get the current path
  const url = new URL(currentUrl);
  const path = url.pathname;

  // Define language versions (currently only de-CH, can be extended)
  const languages = [
    { code: 'de-CH', url: `https://escoria.ch${path}` },
    { code: 'x-default', url: `https://escoria.ch${path}` },
  ];

  return (
    <Helmet>
      {languages.map((lang) => (
        <link
          key={lang.code}
          rel="alternate"
          hrefLang={lang.code}
          href={lang.url}
        />
      ))}
    </Helmet>
  );
};
