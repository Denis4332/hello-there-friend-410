
# Fix: Videos werden angezeigt aber spielen nicht ab

## Problem

Die Videos sind sichtbar und nicht mehr blockiert, aber `currentTime` bleibt bei 0 -- sie starten nie. Das liegt daran, dass `autoPlay` bei Carousel-Slides nicht zuverlaessig funktioniert: Das Video wird im DOM gerendert, aber der Browser startet es nicht automatisch (besonders wenn es nicht der aktive Slide ist oder wenn autoplay-Policies greifen).

## Loesung: VideoPlayer-Komponente mit Autoplay-Fallback

Eine neue `VideoPlayer`-Komponente wird erstellt, die:

1. Per `useRef` auf das Video-Element zugreift
2. Nach dem Mounten `video.play()` programmatisch aufruft
3. Falls `play()` fehlschlaegt (Browser blockiert), einen Play-Button als Overlay anzeigt
4. Bei Klick auf den Play-Button das Video manuell startet

## Aenderungen

### 1. Neue Datei: `src/components/VideoPlayer.tsx`

Erstellt eine wiederverwendbare Komponente:

```typescript
import { useRef, useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  controls?: boolean;
  loop?: boolean;
}

const VideoPlayer = ({ src, className, controls = true, loop = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptAutoplay = async () => {
      try {
        await video.play();
        setShowPlayButton(false);
      } catch {
        setShowPlayButton(true);
      }
    };

    attemptAutoplay();
  }, [src]);

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setShowPlayButton(false);
    } catch (e) {
      console.error('Video play failed:', e);
    }
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={className}
        controls={controls}
        muted
        autoPlay
        loop={loop}
        preload="metadata"
        playsInline
        onClick={handlePlay}
        onError={(e) => console.warn('Video load error:', e)}
      >
        <source src={src} type="video/mp4" />
        Dein Browser unterstuetzt keine Videos.
      </video>
      {showPlayButton && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          aria-label="Video abspielen"
        >
          <Play className="h-16 w-16 text-white" />
        </button>
      )}
    </div>
  );
};
```

### 2. `src/pages/Profil.tsx` - Carousel Video (Zeile 172-185)

Ersetze das direkte `<video>` Element durch `<VideoPlayer>`:

```text
// VORHER:
<video className="w-full h-full object-contain bg-black" controls muted autoPlay loop ...>
  <source src={item.url} type="video/mp4" />
</video>

// NACHHER:
<VideoPlayer
  src={item.url}
  className="w-full h-full object-contain bg-black"
/>
```

### 3. `src/pages/Profil.tsx` - Lightbox Video (ca. Zeile 370-385)

Gleiche Aenderung fuer das Lightbox-Video:

```text
// NACHHER:
<VideoPlayer
  src={mediaItems[lightboxIndex]?.originalUrl}
  className="max-w-full max-h-full object-contain"
/>
```

## Warum das funktioniert

- `autoPlay` allein reicht nicht, weil Browser (besonders Mobile) autoplay oft still ignorieren
- `video.play()` gibt ein Promise zurueck -- wenn es rejected wird, wissen wir dass ein User-Klick noetig ist
- Der Play-Button-Overlay gibt dem User die Moeglichkeit, das Video manuell zu starten
- Nach dem ersten Klick verschwindet der Overlay und das Video laeuft normal mit Controls

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `src/components/VideoPlayer.tsx` | Neue Komponente (Play-Fallback) |
| `src/pages/Profil.tsx` Carousel | `<video>` durch `<VideoPlayer>` ersetzen |
| `src/pages/Profil.tsx` Lightbox | `<video>` durch `<VideoPlayer>` ersetzen |
