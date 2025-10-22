import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackProps {
  error: Error | null;
}

export const ErrorFallback = ({ error }: ErrorFallbackProps) => {
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.DEV;

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Etwas ist schiefgelaufen
          </h1>
          <p className="text-muted-foreground">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück.
          </p>
        </div>

        {isDevelopment && error && (
          <div className="bg-muted p-4 rounded-lg text-left">
            <p className="text-xs font-mono text-foreground break-all">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleReload} variant="default">
            Seite neu laden
          </Button>
          <Button onClick={handleGoHome} variant="outline">
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
};
