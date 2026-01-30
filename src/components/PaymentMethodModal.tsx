import { useState } from 'react';
import { Phone, MessageSquare, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'PHONE' | 'SMS') => Promise<void>;
  listingType?: 'basic' | 'premium' | 'top';
  amount?: number;
  onChangePackage?: () => void;
}

export const PaymentMethodModal = ({ 
  isOpen, 
  onClose, 
  onSelectMethod,
  listingType,
  amount,
  onChangePackage
}: PaymentMethodModalProps) => {
  const [isLoading, setIsLoading] = useState<'PHONE' | 'SMS' | null>(null);

  const handleSelect = async (method: 'PHONE' | 'SMS') => {
    setIsLoading(method);
    try {
      await onSelectMethod(method);
    } finally {
      setIsLoading(null);
    }
  };

  const getListingTypeName = (type: string) => {
    const names: Record<string, string> = {
      basic: 'Standard',
      premium: 'Premium',
      top: 'TOP AD'
    };
    return names[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zahlungsmethode wählen</DialogTitle>
          <DialogDescription>
            Wähle deine bevorzugte Zahlungsart
          </DialogDescription>
        </DialogHeader>
        
        {/* Gewähltes Paket anzeigen */}
        {listingType && amount && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Gewähltes Paket:</span>
                <p className="font-semibold">
                  {getListingTypeName(listingType)} - CHF {amount}
                </p>
              </div>
              {onChangePackage && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={onChangePackage}
                  className="text-xs"
                >
                  Ändern
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="outline"
            size="lg"
            className="h-16 justify-start gap-4"
            onClick={() => handleSelect('PHONE')}
            disabled={isLoading !== null}
          >
            {isLoading === 'PHONE' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
            <div className="text-left">
              <div className="font-semibold">Mit Telefon bezahlen</div>
              <div className="text-sm text-muted-foreground">Bezahlung per Telefonanruf</div>
            </div>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-16 justify-start gap-4"
            onClick={() => handleSelect('SMS')}
            disabled={isLoading !== null}
          >
            {isLoading === 'SMS' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
            <div className="text-left">
              <div className="font-semibold">Mit SMS bezahlen</div>
              <div className="text-sm text-muted-foreground">Bezahlung per SMS-Code</div>
            </div>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Du wirst zu unserem sicheren Zahlungsanbieter weitergeleitet.
        </p>
      </DialogContent>
    </Dialog>
  );
};
