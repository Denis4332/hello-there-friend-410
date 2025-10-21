import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Alle Kategorien</h1>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Entdecken Sie verifizierte Profile nach Kategorie. Jedes Profil wird vor der Freischaltung geprüft.
          </p>

          {isLoading ? (
            <p className="text-muted-foreground">Lade Kategorien...</p>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <p className="text-muted-foreground">Keine Kategorien verfügbar</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
