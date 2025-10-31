import { Crown, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ListingTypeSelectorProps {
  selectedType: 'normal' | 'premium';
  onSelect: (type: 'normal' | 'premium') => void;
  onContinue: () => void;
}

export const ListingTypeSelector = ({
  selectedType,
  onSelect,
  onContinue,
}: ListingTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Wähle deinen Inserat-Typ</h2>
        <p className="text-muted-foreground">
          Beide Optionen sind aktuell kostenlos. Du kannst später jederzeit upgraden.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Normal Listing */}
        <button
          onClick={() => onSelect('normal')}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg",
            selectedType === 'normal'
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Star className="h-6 w-6 text-muted-foreground" />
              </div>
              {selectedType === 'normal' && (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1">Normal Inserat</h3>
              <p className="text-lg font-semibold text-green-600 mb-3">GRATIS</p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Erscheint in allen Suchergebnissen</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Unbegrenzt aktiv</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Basis-Sichtbarkeit</span>
              </li>
            </ul>
          </div>
        </button>

        {/* Premium Listing */}
        <button
          onClick={() => onSelect('premium')}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg",
            selectedType === 'premium'
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-pink-600 text-white text-xs font-bold rounded-full">
              Empfohlen
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-pink-600 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              {selectedType === 'premium' && (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1">Premium Inserat</h3>
              <p className="text-lg font-semibold text-green-600 mb-3">
                GRATIS <span className="text-xs text-muted-foreground">(Limitiert)</span>
              </p>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">Alles von Normal Inserat +</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">Bessere Platzierung (zuerst gezeigt)</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">Goldener VIP Badge mit Animation</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">Größere Darstellung in der Übersicht</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">Mehr Aufmerksamkeit & Klicks</span>
              </li>
            </ul>
          </div>
        </button>
      </div>

      <Button
        onClick={onContinue}
        size="lg"
        className="w-full"
      >
        Weiter zu Fotos
      </Button>
    </div>
  );
};
