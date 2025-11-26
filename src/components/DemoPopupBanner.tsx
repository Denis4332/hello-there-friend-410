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
    localStorage.setItem('demo_popup_last_shown', new Date().toISOString());
    onClose();
  };

  const handleNeverShow = () => {
    localStorage.setItem('demo_popup_never_show', 'true');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <Card 
        className="relative w-[300px] max-w-[300px] border-dashed border-2 border-primary/50 bg-background animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
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
        
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <Badge variant="secondary" className="mb-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Pop-up Banner verfügbar
          </Badge>
          
          <h2 className="text-xl font-bold">
            Maximale Aufmerksamkeit mit Pop-up Bannern!
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Ihre Werbung erscheint als Vollbild-Overlay und kann nicht übersehen werden.
            Perfekt für wichtige Ankündigungen und maximale Reichweite!
          </p>
          
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex flex-col gap-3 justify-center">
              <Link to="/bannerpreise" className="w-full">
                <Button size="default" className="w-full" onClick={handleClose}>
                  Banner buchen (ab CHF 30/Tag)
                </Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Später
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNeverShow}
              className="text-muted-foreground hover:text-foreground"
            >
              Nicht mehr anzeigen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
