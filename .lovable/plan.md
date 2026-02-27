

## Problem Analysis

**Two separate issues identified:**

### 1. Bildqualität ("Jimd quali") - Extrem schlechte Bildkompression
Die Bilder werden aktuell **ultra-aggressiv** komprimiert:
- **Max 500x650px** Auflösung
- **55% Qualität** (WebP/JPEG)

Das ist viel zu aggressiv. Auf einem normalen Handy-Display (390px Breite) sehen die Bilder schon matschig aus, und auf Desktop/Lightbox erst recht. Die Memory sagt eigentlich: Lightbox = 1920px, Carousel = 800px, ProfileCard = 200x267px via Storage Transforms. Aber die Kompression zerstört die Quellbilder schon beim Upload.

### 2. Beschreibung nur 500 Zeichen
Das `about_me` Feld hat im Zod-Schema ein `.max(500)` Limit. Die DB-Spalte selbst hat kein Limit (TEXT). 500 Zeichen ist zu wenig für eine ordentliche Beschreibung.

---

## Plan

### Schritt 1: Bildkompression verbessern
In `src/utils/imageCompression.ts`:
- Max-Auflösung von 500x650 auf **1200x1600px** hochsetzen
- Qualität von 55% auf **80%** hochsetzen
- Sowohl `compressImage` als auch `compressImageBlob` anpassen

Das sorgt dafür, dass Lightbox (1920px via Storage Transforms) und Carousel (800px) ordentlich aussehen, während die Dateigrösse trotzdem kontrolliert bleibt.

### Schritt 2: about_me Limit erhöhen
In `src/components/profile/ProfileForm.tsx`:
- Zod-Validierung von `.max(500)` auf `.max(1500)` ändern
- Fehlermeldung entsprechend anpassen

### Schritt 3: Zeichenzähler im Textfeld anzeigen
In `src/components/profile/sections/AboutMeSection.tsx`:
- Live-Zeichenzähler unter dem Textfeld hinzufügen (z.B. "234 / 1500")
- `watch` aus dem ProfileForm durchreichen um den aktuellen Wert zu lesen

### Schritt 4: BulkImageCompressor Beschreibung aktualisieren
In `src/components/admin/BulkImageCompressor.tsx`:
- Text von "500x650px, 55% WebP" auf die neuen Werte anpassen

