import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';

const ZahlungErfolg = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referenceId = searchParams.get('ref');

  return (
    <>
      <SEO 
        title="Zahlung erhalten"
        description="Ihre Zahlung wurde erfolgreich verarbeitet."
      />
      <Header />
      <main className="container mx-auto px-4 py-12 min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Zahlung erhalten!</CardTitle>
            <CardDescription className="text-base">
              Vielen Dank für Ihre Zahlung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Freischaltung in Bearbeitung</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ihr Profil wird innerhalb von 24 Stunden von unserem Team geprüft und freigeschaltet.
                Sie erhalten eine Benachrichtigung, sobald Ihr Inserat live ist.
              </p>
            </div>

            {referenceId && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Referenz-Nr.:</span>{' '}
                <span className="font-mono">{referenceId}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/mein-profil')} 
                className="flex-1"
              >
                Zu meinem Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')} 
                className="flex-1"
              >
                Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default ZahlungErfolg;
