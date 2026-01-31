
# Banner System v2.0 - Kritische Fixes

## Zusammenfassung der 3 Probleme

| # | Problem | Datei | Status |
|---|---------|-------|--------|
| 1 | Popup-Banner zeigt sich quadratisch statt 3:4 Portrait | `PopupBanner.tsx` | ✅ BEREITS KORREKT |
| 2 | Horizontale Banner-CTA Text passt nicht in 728x90 | `BannerCTA.tsx` | ❌ FIX BENÖTIGT |
| 3 | InContentBanner wird nicht verwendet | `Suche.tsx` | ❌ FIX BENÖTIGT |

---

## Analyse Problem 1: PopupBanner Format

**Aktueller Code ist KORREKT!**

Zeile 114-119 (Demo Popup):
```tsx
<div
  className={`relative w-[90vw] max-w-[300px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
    isVisible ? 'scale-100' : 'scale-95'
  }`}
  style={{ aspectRatio: '3/4' }}
  onClick={(e) => e.stopPropagation()}
>
```

Zeile 145-150 (Real Popup):
```tsx
<div
  className={`relative w-[90vw] max-w-[300px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
    isVisible ? 'scale-100' : 'scale-95'
  }`}
  style={{ aspectRatio: '3/4' }}
  onClick={(e) => e.stopPropagation()}
>
```

Das `aspectRatio: '3/4'` ist bereits auf dem Container gesetzt. Falls es trotzdem quadratisch erscheint, liegt das Problem möglicherweise daran, dass der innere `BannerCTA` das Format nicht respektiert.

---

## Fix 1: BannerCTA für Popup muss h-full haben

**Datei:** `src/components/banners/BannerCTA.tsx`

Das Problem: Der BannerCTA füllt den Container nicht vollständig aus.

**Zeile 17-26 ersetzen durch:**

```tsx
return (
  <div className={`${className} flex justify-center h-full`}>
    <Card 
      className={`relative overflow-hidden border-dashed border-2 border-primary/30 bg-muted/30 h-full ${
        isVertical ? 'w-[300px] max-w-[300px]' : 'w-full max-w-[728px]'
      }`}
      style={{
        aspectRatio: isVertical ? '3/4' : `${config.desktop.width}/${config.desktop.height}`,
      }}
    >
```

---

## Fix 2: Horizontale Banner-CTA einzeilig machen

**Datei:** `src/components/banners/BannerCTA.tsx`

**Zeile 37-60 komplett ersetzen durch:**

```tsx
{/* Responsive Layout: Horizontal für flache, Vertikal für Portrait */}
<div className={`relative h-full flex items-center justify-center overflow-hidden ${
  isVertical 
    ? 'flex-col text-center space-y-3 p-4' 
    : 'flex-row gap-3 px-4 py-2'
}`}>
  {isVertical ? (
    <>
      <Badge variant="secondary" className="mb-2">
        <TrendingUp className="w-3 h-3 mr-1" />
        {config.name} verfügbar
      </Badge>
      
      <h3 className="text-lg font-bold text-foreground">
        Hier könnte Ihre Werbung stehen!
      </h3>
      
      <p className="text-muted-foreground text-sm max-w-xs">
        Erreichen Sie tausende potenzielle Kunden.
      </p>
      
      <div className="text-xs text-muted-foreground">
        ab CHF {config.pricePerDay}/Tag
      </div>
      
      <Button asChild size="default" className="font-semibold">
        <Link to="/bannerpreise">Jetzt buchen</Link>
      </Button>
    </>
  ) : (
    <>
      <Badge variant="secondary" className="shrink-0">
        <TrendingUp className="w-3 h-3 mr-1" />
        Werbeplatz
      </Badge>
      <span className="text-sm font-medium text-foreground truncate">
        Hier werben – ab CHF {config.pricePerDay}/Tag
      </span>
      <Button asChild size="sm" className="shrink-0">
        <Link to="/bannerpreise">Buchen</Link>
      </Button>
    </>
  )}
</div>
```

**Änderungen:**
- Horizontale Banner: `flex-row` mit `gap-3 px-4 py-2`
- Einzeilig: Badge + kurzer Text + Button
- Vertikale Banner: Behalten mehrzeiliges Layout
- `overflow-hidden` auf Content-Container

---

## Fix 3: InContentBanner in Suche.tsx einbinden

**Datei:** `src/pages/Suche.tsx`

### Änderung 1: Import erweitern (Zeile 17)

```tsx
// VORHER:
import { HeaderBanner } from '@/components/banners';

// NACHHER:
import { HeaderBanner, InContentBanner } from '@/components/banners';
```

### Änderung 2: InContentBanner nach HeaderBanner hinzufügen (nach Zeile 295)

```tsx
<HeaderBanner className="my-6" />

<InContentBanner className="my-6" />
```

---

## Erwartetes Ergebnis nach Fixes

| Banner | Format | CTA-Layout |
|--------|--------|------------|
| Header | 728x90 | Eine Zeile: `[Badge] [Text] [Button]` |
| InContent | 728x90 | Eine Zeile: `[Badge] [Text] [Button]` |
| Footer | 728x90 | Eine Zeile: `[Badge] [Text] [Button]` |
| InGrid | 300x400 | Mehrzeilig vertikal |
| Popup | 300x400 | Mehrzeilig vertikal, PORTRAIT Format! |

---

## Dateien die geändert werden

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `src/components/banners/BannerCTA.tsx` | h-full hinzufügen + horizontales Layout einzeilig |
| 2 | `src/pages/Suche.tsx` | InContentBanner Import + Verwendung |

---

## Technische Details

### BannerCTA.tsx - Vollständiger neuer Code

```tsx
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
    <div className={`${className} flex justify-center h-full`}>
      <Card 
        className={`relative overflow-hidden border-dashed border-2 border-primary/30 bg-muted/30 h-full ${
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
        
        {/* Responsive Layout: Horizontal für flache, Vertikal für Portrait */}
        <div className={`relative h-full flex items-center justify-center overflow-hidden ${
          isVertical 
            ? 'flex-col text-center space-y-3 p-4' 
            : 'flex-row gap-3 px-4 py-2'
        }`}>
          {isVertical ? (
            <>
              <Badge variant="secondary" className="mb-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                {config.name} verfügbar
              </Badge>
              
              <h3 className="text-lg font-bold text-foreground">
                Hier könnte Ihre Werbung stehen!
              </h3>
              
              <p className="text-muted-foreground text-sm max-w-xs">
                Erreichen Sie tausende potenzielle Kunden.
              </p>
              
              <div className="text-xs text-muted-foreground">
                ab CHF {config.pricePerDay}/Tag
              </div>
              
              <Button asChild size="default" className="font-semibold">
                <Link to="/bannerpreise">Jetzt buchen</Link>
              </Button>
            </>
          ) : (
            <>
              <Badge variant="secondary" className="shrink-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                Werbeplatz
              </Badge>
              <span className="text-sm font-medium text-foreground truncate">
                Hier werben – ab CHF {config.pricePerDay}/Tag
              </span>
              <Button asChild size="sm" className="shrink-0">
                <Link to="/bannerpreise">Buchen</Link>
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
```
