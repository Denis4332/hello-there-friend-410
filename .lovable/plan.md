
# Banner System v2.0 - Korrekturen

## Zusammenfassung der 4 Änderungen

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `Index.tsx` | FooterBanner vor `</main>` hinzufügen |
| 2 | `BaseBanner.tsx` | `max-w-md` → `max-w-[728px]` für horizontale Banner |
| 3 | `BannerCTA.tsx` | `max-w-md` → `max-w-[728px]` + aspect-ratio |
| 4 | `PopupBanner.tsx` | `w-[90vw] max-w-[300px]` + aspect-ratio 3/4 |

---

## Änderung 1: Index.tsx

**Problem:** FooterBanner wird importiert aber nicht gerendert.

**Zeile 99-100** - FooterBanner vor `</main>` einfügen:

```tsx
// VORHER (Zeile 99-100):
        </Suspense>
      </main>

// NACHHER:
        </Suspense>
        
        <FooterBanner className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 pb-8" />
      </main>
```

---

## Änderung 2: BaseBanner.tsx

**Problem:** Horizontale Banner auf `max-w-md` (448px) begrenzt statt 728px.

**Zeile 57-61** - Breitenbegrenzung korrigieren:

```tsx
// VORHER:
className={`cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
  isVertical 
    ? 'w-[300px] max-w-[300px]' 
    : 'w-full max-w-md mx-auto'
}`}

// NACHHER:
className={`cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
  isVertical 
    ? 'w-[300px] max-w-[300px]' 
    : 'w-full max-w-[728px] mx-auto'
}`}
```

---

## Änderung 3: BannerCTA.tsx

**Problem:** Horizontale CTA-Platzhalter auf `max-w-md` begrenzt, kein festes aspect-ratio.

**Zeile 19-23** - Card mit korrekter Breite und aspect-ratio:

```tsx
// VORHER:
<Card 
  className={`relative overflow-hidden border-dashed border-2 border-primary/30 bg-muted/30 ${
    isVertical ? 'w-[300px] max-w-[300px]' : 'w-full max-w-md'
  }`}
>

// NACHHER:
<Card 
  className={`relative overflow-hidden border-dashed border-2 border-primary/30 bg-muted/30 ${
    isVertical ? 'w-[300px] max-w-[300px]' : 'w-full max-w-[728px]'
  }`}
  style={{
    aspectRatio: isVertical ? '3/4' : `${config.desktop.width}/${config.desktop.height}`,
  }}
>
```

---

## Änderung 4: PopupBanner.tsx

**Problem:** Popup-Format zu gross (400-500px) und inkonsistent.

### 4a) Demo Popup Container (Zeile 114-118)

```tsx
// VORHER:
<div
  className={`relative bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
    isVisible ? 'scale-100' : 'scale-95'
  }`}
  onClick={(e) => e.stopPropagation()}
>

// NACHHER:
<div
  className={`relative w-[90vw] max-w-[300px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
    isVisible ? 'scale-100' : 'scale-95'
  }`}
  style={{ aspectRatio: '3/4' }}
  onClick={(e) => e.stopPropagation()}
>
```

### 4b) Real Popup Container (Zeile 144-148)

```tsx
// VORHER:
<div
  className={`relative w-[90vw] max-w-[400px] md:max-w-[500px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
    isVisible ? 'scale-100' : 'scale-95'
  }`}
  onClick={(e) => e.stopPropagation()}
>

// NACHHER:
<div
  className={`relative w-[90vw] max-w-[300px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
    isVisible ? 'scale-100' : 'scale-95'
  }`}
  style={{ aspectRatio: '3/4' }}
  onClick={(e) => e.stopPropagation()}
>
```

### 4c) Bild-Container (Zeile 159-172)

```tsx
// VORHER:
<div
  className="cursor-pointer rounded-lg overflow-hidden"
  onClick={handleClick}
>
  <img
    src={ad.image_url}
    alt={ad.title}
    loading="lazy"
    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
    onError={(e) => {
      e.currentTarget.src = '/placeholder.svg';
    }}
  />
</div>

// NACHHER:
<div
  className="cursor-pointer rounded-lg overflow-hidden w-full h-full"
  onClick={handleClick}
>
  <img
    src={ad.image_url}
    alt={ad.title}
    loading="lazy"
    className="w-full h-full object-cover rounded-lg"
    onError={(e) => {
      e.currentTarget.src = '/placeholder.svg';
    }}
  />
</div>
```

---

## Erwartetes Ergebnis

| Position | Desktop | Mobile | Verhalten |
|----------|---------|--------|-----------|
| header_banner | 728×90 | 728×90 | Volle Breite bis 728px |
| in_content | 728×90 | 728×90 | Volle Breite bis 728px |
| in_grid | 300×400 | 300×400 | Festes Portrait 3:4 |
| footer_banner | 728×90 | 728×90 | Volle Breite bis 728px |
| popup | 90vw max 300×400 | 90vw max 300×400 | Mobile: 90% Breite, Desktop: fix 300px |

---

## Dateien die geändert werden

1. `src/pages/Index.tsx` - 1 Zeile hinzufügen
2. `src/components/banners/BaseBanner.tsx` - 1 Zeile ändern
3. `src/components/banners/BannerCTA.tsx` - 4 Zeilen ändern
4. `src/components/banners/PopupBanner.tsx` - 3 Blöcke ändern
