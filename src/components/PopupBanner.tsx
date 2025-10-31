import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Advertisement } from '@/types/advertisement';
import { Button } from './ui/button';

interface PopupBannerProps {
  ad: Advertisement;
  onClose: () => void;
  onImpression: () => void;
  onClick: () => void;
}

export const PopupBanner = ({ ad, onClose, onImpression, onClick }: PopupBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    onImpression();
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [onImpression]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    onClick();
    window.open(ad.link_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative max-w-2xl w-full bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
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

        <div
          className="cursor-pointer rounded-lg overflow-hidden"
          onClick={handleClick}
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </div>
  );
};
