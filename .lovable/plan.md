

# Videos komplett entfernen

## Uebersicht

Video-Funktionalitaet wird aus der gesamten Anwendung entfernt -- Anzeige, Upload, Erstellungsprozess und Paketbeschreibungen. Nur Fotos bleiben uebrig.

## Betroffene Dateien

### 1. `src/components/VideoPlayer.tsx` -- LOESCHEN

Die gesamte Komponente wird nicht mehr benoetigt.

### 2. `src/pages/Profil.tsx` -- Video-Logik entfernen

- `VideoPlayer`-Import entfernen
- `mediaItems`-Mapping vereinfachen: Kein `isVideo`-Check mehr, nur noch Foto-URLs
- Carousel: Nur noch `<img>` rendern (kein `isVideo`-Branch)
- Lightbox: Nur noch `<img>` rendern (kein `isVideo`-Branch)

### 3. `src/components/ProfileCard.tsx` -- Video-Anzeige entfernen

- `Play`-Icon Import entfernen
- `primaryIsVideo`, `hasVideo`, `videoUrl`, `posterPhoto` Variablen entfernen
- Video-`<video>`-Tag im Render entfernen, nur `<img>` behalten
- "Video"-Badge-Indicator unten links entfernen

### 4. `src/components/profile/PhotoUploader.tsx` -- Video-Upload entfernen

- `Video`, `Play` aus Imports entfernen
- `MEDIA_LIMITS` auf nur `photos` reduzieren (kein `videos` mehr)
- `MAX_VIDEO_SIZE_MB` und `ALLOWED_VIDEO_FORMATS` Konstanten entfernen
- `videoCount` Variable entfernen
- `handleFileSelect` vereinfachen (kein `video`-Typ mehr)
- `videoPreviews` Variable entfernen
- Gesamten "Video Upload Section" Block (Zeile 529-607) entfernen

### 5. `src/components/profile/ListingTypeSelector.tsx` -- Video-Texte entfernen

- `Video`-Icon Import entfernen
- Premium: "10 Fotos + 1 Video" aendern zu "10 Fotos"
- TOP AD: "15 Fotos + 2 Videos" aendern zu "15 Fotos", `Video`-Icon durch `Camera` ersetzen

### 6. `src/pages/ProfileEdit.tsx` -- Video-Limits entfernen

- `MEDIA_LIMITS` auf nur `photos` reduzieren
- Video-bezogene Filter/Checks entfernen

### 7. `supabase/functions/validate-image/index.ts` -- Video-Validierung entfernen

- MP4 und WebM MIME-Type Erkennung entfernen
- Fehlermeldung auf nur Bildformate anpassen
- Video-spezifische Groessenlimits entfernen

## Was NICHT geaendert wird

- Die `media_type`-Spalte in der Datenbank bleibt bestehen (keine Migration noetig)
- Bereits hochgeladene Videos bleiben im Storage (kein Datenverlust)
- Die Typen in `dating.ts` / `common.ts` bleiben unveraendert

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `VideoPlayer.tsx` | Loeschen |
| `Profil.tsx` | Video-Rendering entfernen |
| `ProfileCard.tsx` | Video-Anzeige + Badge entfernen |
| `PhotoUploader.tsx` | Video-Upload-Sektion entfernen |
| `ListingTypeSelector.tsx` | Video-Texte aus Paketen entfernen |
| `ProfileEdit.tsx` | Video-Limits entfernen |
| `validate-image/index.ts` | Video-Validierung entfernen |

