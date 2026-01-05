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
}

export const PaymentMethodModal = ({ isOpen, onClose, onSelectMethod }: PaymentMethodModalProps) => {
  const [isLoading, setIsLoading] = useState<'PHONE' | 'SMS' | null>(null);

  const handleSelect = async (method: 'PHONE' | 'SMS') => {
    setIsLoading(method);
    try {
      await onSelectMethod(method);
    } finally {
      setIsLoading(null);
    }
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
      </DialogContent>
    </Dialog>
  );
};
