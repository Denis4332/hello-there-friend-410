import { X, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface DemoPopupBannerProps {
  onClose: () => void;
}

export const DemoPopupBanner = ({ onClose }: DemoPopupBannerProps) => {
  const handleClose = () => {
    sessionStorage.setItem('demo_popup_shown', 'true');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <Card 
        className="relative max-w-2xl w-full border-dashed border-2 border-primary/50 bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardContent className="pt-12 pb-8 text-center space-y-4">
          <Badge variant="secondary" className="mb-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Pop-up Banner verfügbar
          </Badge>
          
          <h2 className="text-3xl font-bold">
            Maximale Aufmerksamkeit mit Pop-up Bannern!
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto">
            Ihre Werbung erscheint als Vollbild-Overlay und kann nicht übersehen werden.
            Perfekt für wichtige Ankündigungen und maximale Reichweite!
          </p>
          
          <div className="flex gap-3 justify-center pt-4">
            <Button asChild size="lg">
              <Link to="/bannerpreise">
                Banner buchen (ab CHF 50/Tag)
              </Link>
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Später
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
