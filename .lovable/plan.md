

# Status: GPS läuft SCHON über Browser

## Was aktuell passiert

### GPS-Suche ("In meiner Nähe suchen") — `Suche.tsx`
**Läuft bereits über Browser.** Zeile 160: `navigator.geolocation.getCurrentPosition` holt lat/lng direkt vom Browser. Diese Koordinaten gehen direkt an `useProfilesByRadius` → fertig. Funktioniert.

Die Funktion `detectLocation()` aus `geolocation.ts` wird nur aufgerufen um den **Anzeige-Namen** zu holen (z.B. "Stein AG" für den Toast). Die macht einen DB-Lookup — aber das beeinflusst die Suche nicht, nur den Text der angezeigt wird.

### Profil-Bearbeitung — `LocationSection.tsx`  
**Läuft bereits über Google Places Autocomplete im Browser.** lat/lng, city, canton, postal_code — alles kommt direkt von Google. Funktioniert.

### Das einzige Problem
`ProfileEdit.tsx` Zeile 84-101: `resolveCanonicalCity` macht nach dem Laden UND nach dem Speichern einen **unnötigen DB-Lookup** der den Stadtnamen überschreibt. Google sagt "Stein AG", die DB-Funktion macht daraus "Stein" wegen dem kaputten Canton-Join. Das ist der einzige Bug.

## Was gemacht werden muss

### Änderung 1: `resolveCanonicalCity` löschen in `ProfileEdit.tsx`
- Zeile 84-101: Funktion komplett löschen
- Zeile 124-128: `canonicalCity` weg, `profileRes.data` enthält city schon
- Zeile 139: `city: canonicalCity` → einfach weg (city ist schon in `...profileRes.data`)
- Zeile 187: `resolveCanonicalCity` Aufruf löschen
- Zeile 197: `city: canonicalCity` → `city: data.city`

**Ergebnis:** Was Google Places liefert wird 1:1 gespeichert. Kein Nachschlagen.

### Änderung 2: Pending-Banner sichtbarer in `UserDashboard.tsx`
- Zeile 386-394: Oranger Banner mit Clock-Icon statt dezenter Text

### Optional: `detectLocation()` in `geolocation.ts` vereinfachen
Die DB-Abfrage dort ist nur für den Anzeige-Text im Toast. Könnte man durch Google Reverse Geocoding ersetzen, aber es beeinflusst die Suchfunktion nicht — rein kosmetisch.

## Was sich NICHT ändert

| Bereich | Status |
|---------|--------|
| Browser GPS für Suche | Schon über Browser — bleibt so |
| Google Places Autocomplete | Schon über Browser — bleibt so |
| Radius-Suche mit lat/lng | Unverändert |
| Kanton-Filter | Unverändert |
| Kategorien-Filter | Unverändert |
| `search_profiles_by_radius_v2` | Unverändert |

## Zusammenfassung

GPS geht schon über Browser. Der einzige Fix ist: `resolveCanonicalCity` löschen damit der Google-Stadtname nicht durch einen kaputten DB-Lookup überschrieben wird. 1 Funktion löschen, 4 Zeilen anpassen.

