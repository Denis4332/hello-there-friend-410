import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const PayportReturn = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'redirecting'>('loading');
  const debug = searchParams.get('debug') === '1';

  useEffect(() => {
    const processPayment = async () => {
      // Get all query parameters from PayPort callback
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      if (debug) {
        console.log('PayportReturn - Processing with params:', params);
      }

      try {
        const { data, error } = await supabase.functions.invoke('payport-return', {
          body: params
        });

        if (debug) {
          console.log('PayportReturn - Response:', data, error);
        }

        setStatus('redirecting');

        if (error) {
          console.error('PayportReturn - Error:', error);
          // Hard reload to ensure fresh state
          window.location.assign('/mein-profil?payment=error&ts=' + Date.now());
          return;
        }

        // Redirect to the URL provided by the edge function
        // Use window.location.assign for hard reload to ensure fresh profile data
        const redirectUrl = data?.redirect || '/mein-profil?payment=failed&step=no_redirect&ts=' + Date.now();
        window.location.assign(redirectUrl);
      } catch (err) {
        console.error('PayportReturn - Exception:', err);
        window.location.assign('/mein-profil?payment=error&ts=' + Date.now());
      }
    };

    processPayment();
  }, [searchParams, debug]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">
          {status === 'loading' ? 'Zahlung wird geprüft...' : 'Weiterleitung...'}
        </p>
      </div>
    </div>
  );
};

export default PayportReturn;
