import { Crown, Star, CheckCircle2, Camera, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ListingTypeSelectorProps {
  selectedType: 'basic' | 'premium' | 'top';
  onSelect: (type: 'basic' | 'premium' | 'top') => void;
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
        <h2 className="text-2xl font-bold mb-2">Wähle dein Inserat-Paket</h2>
        <p className="text-muted-foreground">
          Wähle das Paket, das am besten zu dir passt. Du kannst jederzeit upgraden.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Basic Listing */}
        <button
          onClick={() => onSelect('basic')}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg",
            selectedType === 'basic'
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              {selectedType === 'basic' && (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1">Standard</h3>
              <p className="text-lg font-semibold text-foreground mb-3">CHF 49/Monat</p>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="font-medium">Sichtbar im gewählten Kanton</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="font-medium">Kontaktdaten anzeigen</span>
              </li>
              <li className="flex items-start gap-2 bg-muted/50 -mx-2 px-2 py-1 rounded">
                <Camera className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-muted-foreground">📷 Bis zu 5 Fotos</span>
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
              Beliebt
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
              <h3 className="text-xl font-bold mb-1">Premium</h3>
              <p className="text-lg font-semibold text-foreground mb-3">CHF 99/Monat</p>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Alles von Standard +</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">VIP Badge</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium">Bessere Platzierung</span>
              </li>
              <li className="flex items-start gap-2 bg-amber-100/50 dark:bg-amber-900/30 -mx-2 px-2 py-1 rounded">
                <Camera className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span className="font-medium text-amber-700 dark:text-amber-400">📷 10 Fotos + 🎬 1 Video</span>
              </li>
            </ul>
          </div>
        </button>

        {/* TOP AD Listing */}
        <button
          onClick={() => onSelect('top')}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg border-red-500/50",
            selectedType === 'top'
              ? "border-red-500 bg-red-500/5 shadow-lg shadow-red-500/20"
              : "hover:border-red-500"
          )}
        >
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold rounded-full animate-pulse">
              TOP
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                <Crown className="h-6 w-6 text-white" />
              </div>
              {selectedType === 'top' && (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1">TOP AD</h3>
              <p className="text-lg font-semibold text-foreground mb-3">CHF 199/Monat</p>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Alles von Premium +</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                <span className="font-medium">Immer ganz oben platziert</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                <span className="font-medium">Schweizweit auf Startseite</span>
              </li>
              <li className="flex items-start gap-2 bg-red-100/50 dark:bg-red-900/30 -mx-2 px-2 py-1 rounded">
                <Video className="h-4 w-4 mt-0.5 text-red-600 flex-shrink-0" />
                <span className="font-medium text-red-700 dark:text-red-400">📷 15 Fotos + 🎬 2 Videos</span>
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