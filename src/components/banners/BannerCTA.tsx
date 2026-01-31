import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { BannerPosition, BANNER_CONFIG } from '@/types/advertisement';

interface BannerCTAProps {
  position: BannerPosition;
  className?: string;
}

export const BannerCTA = ({ position, className = '' }: BannerCTAProps) => {
  const config = BANNER_CONFIG[position];
  const isVertical = position === 'in_grid' || position === 'popup';
  
  return (
    <div className={`${className} flex justify-center`}>
      <Card 
        className={`relative overflow-hidden border-dashed border-2 border-primary/30 bg-muted/30 ${
          isVertical ? 'w-[300px] max-w-[300px]' : 'w-full max-w-[728px]'
        }`}
        style={{
          aspectRatio: isVertical ? '3/4' : `${config.desktop.width}/${config.desktop.height}`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <img 
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=40&w=800"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-[0.08]"
          />
        </div>
        
        <div className={`relative text-center space-y-3 ${isVertical ? 'p-4' : 'p-6'}`}>
          <Badge variant="secondary" className="mb-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            {config.name} verfügbar
          </Badge>
          
          <h3 className={`font-bold text-foreground ${isVertical ? 'text-lg' : 'text-xl'}`}>
            Hier könnte Ihre Werbung stehen!
          </h3>
          
          <p className="text-muted-foreground mx-auto text-sm max-w-xs">
            Erreichen Sie tausende potenzielle Kunden mit einer prominent platzierten Anzeige.
          </p>
          
          <div className="text-xs text-muted-foreground">
            ab CHF {config.pricePerDay}/Tag
          </div>
          
          <Button asChild size="default" className="font-semibold">
            <Link to="/bannerpreise">
              Jetzt buchen
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};
