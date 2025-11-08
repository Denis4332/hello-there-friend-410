import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showUI?: boolean;
}

export const Breadcrumbs = ({ items, showUI = true }: BreadcrumbsProps) => {
  const { data: enabled } = useSiteSetting('breadcrumbs_enabled');
  const { data: homeLabel } = useSiteSetting('breadcrumbs_home_label');

  if (enabled === 'false') return null;

  const allItems = [
    { label: homeLabel || 'Home', href: '/' },
    ...items,
  ];

  // Generate Schema.org BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${window.location.origin}${item.href}` }),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {showUI && (
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            {allItems.map((item, index) => (
              <BreadcrumbItem key={index}>
                {index < allItems.length - 1 ? (
                  <>
                    <BreadcrumbLink asChild>
                      <Link to={item.href || '/'}>{item.label}</Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  </>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </>
  );
};
