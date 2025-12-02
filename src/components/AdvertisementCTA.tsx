import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp } from 'lucide-react';

interface AdvertisementCTAProps {
  position: 'top' | 'grid';
  className?: string;
}

export const AdvertisementCTA = ({ position, className = '' }: AdvertisementCTAProps) => {
  const isTopPosition = position === 'top';
  
  return (
    <div className={`${className} flex justify-center`}>
      <Card className="relative overflow-hidden border-dashed border-2 border-primary/30 bg-muted/30 w-full">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=40&w=800")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
        }}
      />
      
      <div className="relative text-center space-y-3 p-6">
        <Badge variant="secondary" className="mb-2">
          <TrendingUp className="w-3 h-3 mr-1" />
          {isTopPosition ? 'Premium-Position verfügbar' : 'Werbeplatz verfügbar'}
        </Badge>
        
        <h3 className="font-bold text-foreground text-xl">
          {isTopPosition ? 'Hier könnte Ihre Werbung stehen!' : 'Ihre Anzeige hier'}
        </h3>
        
        <p className="text-muted-foreground mx-auto text-sm max-w-xs">
          {isTopPosition 
            ? 'Erreichen Sie tausende potenzielle Kunden mit einer prominent platzierten Anzeige.'
            : 'Präsentieren Sie Ihr Angebot zwischen den Profilen.'}
        </p>
        
        <Button asChild size="default" className="font-semibold">
          <Link to="/bannerpreise">
            {isTopPosition ? 'Jetzt Top-Position sichern!' : 'Banner buchen'}
          </Link>
        </Button>
      </div>
    </Card>
    </div>
  );
};
