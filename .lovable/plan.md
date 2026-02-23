

# Google Places API Key direkt in LocationSection.tsx einsetzen

## Aenderung

Eine einzige Aenderung in `src/components/profile/sections/LocationSection.tsx`:

### Zeile 67: `import.meta.env.VITE_GOOGLE_PLACES_KEY` ersetzen

```diff
- const googleApiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY;
+ const googleApiKey = 'AIzaSyB2IiCDINcTgGPMnNLi8hvmEPcf_-rH3Gs';
```

## Warum das sicher ist

- Google Maps JS API Keys sind oeffentlich (werden im Browser geladen)
- Absicherung erfolgt ueber HTTP-Referrer-Restrictions in der Google Cloud Console
- Standard-Praxis fuer alle Google Maps Integrationen

## Was sich aendert

- Google Places Autocomplete wird beim Tippen Vorschlaege anzeigen (Schweizer Adressen)
- Kanton, Stadt und PLZ werden automatisch ausgefuellt
- GPS-Koordinaten werden automatisch gesetzt

## Technische Details

- Nur eine Zeile in einer Datei wird geaendert
- Keine andere Logik wird beruehrt
- Die gesamte Autocomplete-Logik ist bereits implementiert und funktionsfaehig

