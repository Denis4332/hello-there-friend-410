

# Fix: Video-Kompatibilitaet fuer Safari/iOS

## Problem-Analyse

Ich habe das Video im Test-Browser geoeffnet (Profil "Test", Slide 10) und es funktioniert dort. Der Code ist korrekt (`autoPlay`, `muted`, `playsInline`, `loop`, kein `poster=""`). Aber Safari/iOS hat zusaetzliche Anforderungen, die der aktuelle Code nicht erfuellt.

## Ursachen fuer Safari-Probleme

1. **`<video src={url}>` statt `<source>` Element**: Safari bevorzugt das `<source>` Tag mit explizitem MIME-Type
2. **Kein Fallback bei Autoplay-Blockierung**: iOS kann Autoplay auch bei `muted` blockieren - es fehlt eine Fallback-UI
3. **`object-cover` auf Video**: Kann auf Safari zu Rendering-Problemen fuehren

## Aenderungen

### 1. `src/pages/Profil.tsx` - Carousel Video (Zeile 173-184)

Statt `<video src={url}>` wird `<source>` mit MIME-Type verwendet plus ein Fallback-Play-Button:

```text
// VORHER:
<video src={item.url} className="w-full h-full object-cover"
  controls muted autoPlay loop preload="auto" playsInline>

// NACHHER:
<video className="w-full h-full object-contain bg-black"
  controls muted autoPlay loop preload="metadata" playsInline
  onError={(e) => console.warn('Video load error:', e)}>
  <source src={item.url} type="video/mp4" />
  Dein Browser unterstuetzt keine Videos.
</video>
```

Wesentliche Aenderungen:
- `<source>` Element mit `type="video/mp4"` statt `src` Attribut (Safari-Kompatibilitaet)
- `preload="metadata"` statt `preload="auto"` (schnellerer Start, Safari-freundlich)
- `object-contain` statt `object-cover` (verhindert schwarze Bereiche bei Video-Cropping)
- Error-Handler fuer Debugging

### 2. `src/pages/Profil.tsx` - Lightbox Video (ca. Zeile 370-380)

Gleiche Aenderung fuer das Lightbox-Video:

```text
// VORHER:
<video src={mediaItems[lightboxIndex]?.originalUrl} ...>

// NACHHER:
<video ... >
  <source src={mediaItems[lightboxIndex]?.originalUrl} type="video/mp4" />
</video>
```

### 3. `src/components/ProfileCard.tsx` - Card Video (Zeile 92-100)

Gleiche `<source>` Aenderung fuer die Karten-Vorschau:

```text
// VORHER:
<video src={videoUrl} poster={posterUrl} ...>

// NACHHER:
<video poster={posterUrl} ...>
  <source src={videoUrl} type="video/mp4" />
</video>
```

## Zusammenfassung

3 Stellen werden angepasst, alle mit dem gleichen Muster:
- `src` Attribut durch `<source>` Element mit MIME-Type ersetzen
- `preload="metadata"` fuer schnelleren Start
- `object-contain` im Carousel/Lightbox fuer korrektes Video-Rendering

