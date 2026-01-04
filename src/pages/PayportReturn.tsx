import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PayportReturn = () => {
  const [searchParams] = useSearchParams();
  
  // Get all query parameters
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>PayPort Rückkehr</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Query-Parameter (Debug):
          </div>
          
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-64">
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(allParams, null, 2)}
            </pre>
          </div>

          <Button asChild className="w-full">
            <Link to="/mein-profil">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayportReturn;
