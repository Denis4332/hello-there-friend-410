import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SEO } from '@/components/SEO';

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const { getSetting } = useSiteSettingsContext();

  const seoTitle = getSetting('seo_categories_title');
  const seoDescription = getSetting('seo_categories_description');
  const pageTitle = getSetting('categories_page_title');
  const pageDescription = getSetting('categories_page_subtitle');
  const loadingText = getSetting('categories_loading_text');
  const emptyText = getSetting('categories_empty_text');
  
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || pageTitle || 'Alle Kategorien'}
        description={seoDescription || pageDescription || 'Entdecken Sie verifizierte Profile nach Kategorie'}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Kategorien' }]} />
          <h1 className="text-3xl font-bold mb-4">{pageTitle || 'Alle Kategorien'}</h1>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            {pageDescription || 'Entdecken Sie verifizierte Profile nach Kategorie. Jedes Profil wird vor der Freischaltung geprüft.'}
          </p>

          {isLoading ? (
            <p className="text-muted-foreground">{loadingText || 'Lade Kategorien...'}</p>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 content-visibility-auto">
              {categories.map((category) => (
                <Link key={category.id} to={`/kategorie/${category.slug}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-bold text-lg">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{emptyText || 'Keine Kategorien verfügbar'}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;