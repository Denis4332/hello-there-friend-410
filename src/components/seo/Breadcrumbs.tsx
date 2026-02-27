import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
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
  const { getSetting } = useSiteSettingsContext();

  const enabled = getSetting('breadcrumbs_enabled');
  const homeLabel = getSetting('breadcrumbs_home_label');

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
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {index < allItems.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.href || '/'}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < allItems.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </>
  );
};