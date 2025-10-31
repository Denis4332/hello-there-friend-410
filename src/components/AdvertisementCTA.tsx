import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface AdvertisementCTAProps {
  position: 'top' | 'grid';
  className?: string;
}

export const AdvertisementCTA = ({ position, className = '' }: AdvertisementCTAProps) => {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
        }}
      />
      
      <div className="relative p-8 text-center space-y-4">
        <h3 className="text-2xl font-bold text-foreground">
          Möchten Sie an dieser Stelle werben?
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Erreichen Sie tausende potenzielle Kunden mit einer gut sichtbaren Bannerplatzierung.
        </p>
        <Button asChild size="lg" className="font-semibold">
          <Link to="/bannerpreise">
            Jetzt Banner buchen!
          </Link>
        </Button>
      </div>
    </Card>
  );
};
