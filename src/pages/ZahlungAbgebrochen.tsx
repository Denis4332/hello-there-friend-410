import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const ZahlungAbgebrochen = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Zahlung abgebrochen"
        description="Die Zahlung wurde abgebrochen."
      />
      <Header />
      <main className="container mx-auto px-4 py-12 min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Zahlung abgebrochen</CardTitle>
            <CardDescription className="text-base">
              Die Zahlung wurde nicht abgeschlossen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Keine Sorge, es wurde nichts berechnet. Sie können den Zahlungsvorgang 
                jederzeit erneut starten.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/user/upgrade')} 
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/mein-profil')} 
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default ZahlungAbgebrochen;
