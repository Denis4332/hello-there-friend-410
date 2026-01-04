import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ArrowRight, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type PaymentStatus = 'loading' | 'pending' | 'paid' | 'failed';

const ZahlungErfolg = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referenceId = searchParams.get('ref');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!referenceId) {
        setPaymentStatus('pending');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('payment_status')
          .eq('payment_reference', referenceId)
          .single();

        if (error || !data) {
          console.error('Error fetching payment status:', error);
          setPaymentStatus('pending');
          return;
        }

        // Map database status to our UI status
        if (data.payment_status === 'paid') {
          setPaymentStatus('paid');
        } else if (data.payment_status === 'failed') {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
        }
      } catch (err) {
        console.error('Error checking payment:', err);
        setPaymentStatus('pending');
      }
    };

    checkPaymentStatus();
  }, [referenceId]);

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Status wird geladen...</CardTitle>
            <CardDescription className="text-base">
              Bitte warten Sie einen Moment.
            </CardDescription>
          </>
        );

      case 'failed':
        return (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Zahlung fehlgeschlagen</CardTitle>
            <CardDescription className="text-base">
              Leider konnte Ihre Zahlung nicht verarbeitet werden.
            </CardDescription>
          </>
        );

      case 'paid':
        return (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Zahlung erfolgreich!</CardTitle>
            <CardDescription className="text-base">
              Vielen Dank für Ihre Zahlung.
            </CardDescription>
          </>
        );

      case 'pending':
      default:
        return (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">Zahlung wird verarbeitet</CardTitle>
            <CardDescription className="text-base">
              Wir haben Ihre Anfrage erhalten.
            </CardDescription>
          </>
        );
    }
  };

  return (
    <>
      <SEO 
        title={paymentStatus === 'paid' ? "Zahlung erfolgreich" : paymentStatus === 'failed' ? "Zahlung fehlgeschlagen" : "Zahlung wird verarbeitet"}
        description="Status Ihrer Zahlung."
      />
      <Header />
      <main className="container mx-auto px-4 py-12 min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="pb-4">
            {renderContent()}
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentStatus === 'pending' && (
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
            )}

            {paymentStatus === 'paid' && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Zahlung bestätigt</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ihre Zahlung wurde erfolgreich verarbeitet. Ihr Profil wird nun freigeschaltet.
                </p>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="bg-destructive/10 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bitte versuchen Sie es erneut oder kontaktieren Sie unseren Support.
                </p>
                <Button 
                  variant="destructive"
                  onClick={() => navigate('/mein-profil')}
                  className="w-full"
                >
                  Erneut versuchen
                </Button>
              </div>
            )}

            {referenceId && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Referenz-Nr.:</span>{' '}
                <span className="font-mono">{referenceId}</span>
              </div>
            )}

            {paymentStatus !== 'failed' && (
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
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default ZahlungErfolg;
