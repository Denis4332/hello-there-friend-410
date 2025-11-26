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
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-[300px] max-w-[300px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 md:top-4 md:right-4 z-10 bg-background/90 hover:bg-background h-10 w-10 rounded-full shadow-lg"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div
          className="cursor-pointer rounded-lg overflow-hidden"
          onClick={handleClick}
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            loading="lazy"
            className="w-full h-auto max-h-[250px] object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      </div>
    </div>
  );
};
