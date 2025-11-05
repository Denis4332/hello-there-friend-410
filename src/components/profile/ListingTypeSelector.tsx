import { Crown, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ListingTypeSelectorProps {
  selectedType: 'free' | 'basic' | 'premium' | 'top';
  onSelect: (type: 'free' | 'basic' | 'premium' | 'top') => void;
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
          Alle Optionen sind aktuell kostenlos während der Beta-Phase. Du kannst später jederzeit upgraden.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Free Listing */}
        <button
          onClick={() => onSelect('free')}
          className={cn(
            "relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg",
            selectedType === 'free'
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Star className="h-5 w-5 text-muted-foreground" />
              </div>
              {selectedType === 'free' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1">Basis</h3>
              <p className="text-sm font-semibold text-green-600 mb-2">GRATIS</p>
            </div>

            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Basis-Sichtbarkeit</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Unbegrenzt aktiv</span>
              </li>
            </ul>
          </div>
        </button>

        {/* Basic Listing */}
        <button
          onClick={() => onSelect('basic')}
          className={cn(
            "relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg",
            selectedType === 'basic'
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              {selectedType === 'basic' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1">Standard</h3>
              <p className="text-sm font-semibold text-green-600 mb-2">
                GRATIS <span className="text-xs text-muted-foreground">(Beta)</span>
              </p>
            </div>

            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">Alles von Basis +</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                <span className="font-medium">Bessere Platzierung</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                <span className="font-medium">Hervorgehobene Darstellung</span>
              </li>
            </ul>
          </div>
        </button>

        {/* Premium Listing */}
        <button
          onClick={() => onSelect('premium')}
          className={cn(
            "relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg",
            selectedType === 'premium'
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-pink-600 text-white text-[10px] font-bold rounded-full">
              Beliebt
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-pink-600 flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              {selectedType === 'premium' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1">Premium</h3>
              <p className="text-sm font-semibold text-green-600 mb-2">
                GRATIS <span className="text-xs text-muted-foreground">(Beta)</span>
              </p>
            </div>

            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">Alles von Standard +</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">VIP Badge mit Animation</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">Größere Darstellung</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">Mehr Aufmerksamkeit</span>
              </li>
            </ul>
          </div>
        </button>

        {/* TOP AD Listing */}
        <button
          onClick={() => onSelect('top')}
          className={cn(
            "relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg border-red-500/50",
            selectedType === 'top'
              ? "border-red-500 bg-red-500/5 shadow-lg shadow-red-500/20"
              : "hover:border-red-500"
          )}
        >
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-pink-600 text-white text-[10px] font-bold rounded-full animate-pulse">
              TOP
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                <Crown className="h-5 w-5 text-white" />
              </div>
              {selectedType === 'top' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1">TOP AD</h3>
              <p className="text-sm font-semibold text-green-600 mb-2">
                GRATIS <span className="text-xs text-muted-foreground">(Beta)</span>
              </p>
            </div>

            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">Alles von Premium +</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                <span className="font-medium">Immer ganz oben</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                <span className="font-medium">TOP AD Banner</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                <span className="font-medium">Maximale Sichtbarkeit</span>
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
