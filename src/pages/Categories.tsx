import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { mockCategories } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';

const Categories = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Alle Kategorien</h1>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Entdecken Sie verifizierte Profile nach Kategorie. Jedes Profil wird vor der Freischaltung geprüft.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mockCategories
              .filter((cat) => cat.active)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((category) => (
                <Link key={category.id} to={`/kategorie/${category.slug}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-bold text-lg">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
