import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const PayportReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'redirecting'>('loading');

  useEffect(() => {
    const processPayment = async () => {
      // Get all query parameters from PayPort callback
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      console.log('PayportReturn - Processing with params:', params);

      try {
        const { data, error } = await supabase.functions.invoke('payport-return', {
          body: params
        });

        console.log('PayportReturn - Response:', data, error);

        setStatus('redirecting');

        if (error) {
          console.error('PayportReturn - Error:', error);
          navigate('/mein-profil?payment=error');
          return;
        }

        // Redirect to the URL provided by the edge function
        const redirectUrl = data?.redirect || '/mein-profil?payment=unknown';
        navigate(redirectUrl);
      } catch (err) {
        console.error('PayportReturn - Exception:', err);
        navigate('/mein-profil?payment=error');
      }
    };

    processPayment();
  }, [searchParams, navigate]);

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
