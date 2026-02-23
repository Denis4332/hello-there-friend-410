

# Google Places API Key direkt einsetzen

## Problem

Die Aenderung wurde bisher **nicht umgesetzt** -- der Planungsmodus hat keine Dateiaenderungen erlaubt. Der API Key muss jetzt tatsaechlich in den Code geschrieben werden.

## Aenderung

Eine einzige Zeile in `src/components/profile/sections/LocationSection.tsx` (Zeile 67):

```diff
- const googleApiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY;
+ const googleApiKey = 'AIzaSyB2IiCDINcTgGPMnNLi8hvmEPcf_-rH3Gs';
```

## Ergebnis

- Google Places Autocomplete zeigt Vorschlaege beim Tippen (Schweizer Adressen)
- Kanton, Stadt, PLZ und GPS-Koordinaten werden automatisch ausgefuellt
- Keine andere Logik wird beruehrt

