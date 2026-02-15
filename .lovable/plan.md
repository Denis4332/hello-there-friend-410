

# Fix: Rotation-Konflikt + Video auf Safari

## Issue 1: Rotation-Konflikt (10 Min vs 30 Min)

Es gibt eine Inkonsistenz zwischen drei Stellen:

| Datei | Aktuell | Soll |
|-------|---------|------|
| `useRotationKey.ts` (Zeile 8) | 10 Minuten | 30 Minuten |
| `profileUtils.ts` (Zeile 15) | 30 Minuten | 30 Minuten (OK) |
| `RotationDebugTool.tsx` (Zeile 27, 38) | 10 Minuten | 30 Minuten |

Der Hook sagt 10 Min, der Algorithmus-Fallback sagt 30 Min. Das fuehrt dazu, dass der Hook alle 10 Min einen neuen Key liefert, aber wenn kein Key uebergeben wird, rechnet `profileUtils` mit 30 Min -- Konflikt.

### Fix

Alle drei Dateien auf **30 Minuten** vereinheitlichen:

- `useRotationKey.ts` Zeile 8: `10 * 60 * 1000` aendern zu `30 * 60 * 1000`
- `RotationDebugTool.tsx` Zeile 27 + 38: `10 * 60 * 1000` aendern zu `30 * 60 * 1000`
- Kommentar in RotationDebugTool Zeile 69 anpassen: "alle 30 Min"

## Issue 2: Videos schwarz auf Safari

**Ursache:** `poster=""` (leerer String) auf Zeile 180 in `Profil.tsx` verhindert, dass iOS Safari den ersten Video-Frame als Vorschau rendert.

### Fix in `src/pages/Profil.tsx`

**Carousel-Video (Zeile 173-183):**
- `poster=""` entfernen
- `autoPlay` und `loop` hinzufuegen
- Kombination `muted` + `playsInline` + `autoPlay` erzwingt iOS-Kompatibilitaet

```text
// VORHER:
<video src={item.url} controls muted preload="auto" playsInline poster="">

// NACHHER:
<video src={item.url} controls muted autoPlay loop preload="auto" playsInline>
```

**Lightbox-Video (Zeile 370-380):** Bereits korrekt (hat `autoPlay`, kein `poster=""`). Nur `loop` hinzufuegen fuer konsistente UX.

## Zusammenfassung

4 Dateien werden angepasst:
1. `src/hooks/useRotationKey.ts` -- 10 auf 30 Min
2. `src/lib/profileUtils.ts` -- keine Aenderung (bereits 30 Min)
3. `src/components/admin/RotationDebugTool.tsx` -- 10 auf 30 Min
4. `src/pages/Profil.tsx` -- Video-Fix fuer iOS Safari

