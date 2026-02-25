

## Bestaetigung: Nichts geht kaputt

### Das Problem
Die Datenbank hat einen CHECK Constraint: `postal_code ~ '^\d{4}$'` — wenn ein Wert da ist, muss er 4 Ziffern sein. Das Frontend sendet aber `""` (leerer String) wenn nichts eingegeben wird, und `""` faellt durch den Check. **NULL ist erlaubt.**

### Die Aenderung (3 Stellen, je 1 Zeile)

| Datei | Zeile | Vorher | Nachher |
|---|---|---|---|
| `ProfileCreate.tsx` | 204 | `postal_code: data.postal_code,` | `postal_code: data.postal_code \|\| null,` |
| `ProfileEdit.tsx` | 173 | `postal_code: data.postal_code,` | `postal_code: data.postal_code \|\| null,` |
| `LocationSection.tsx` | 154 | `PLZ` | `PLZ (optional)` |

### Was passiert genau

- Wenn Google Autocomplete eine PLZ liefert (z.B. "8001") → wird gespeichert wie bisher
- Wenn keine PLZ da ist (z.B. "Basel-Stadt") → wird NULL gespeichert statt "" → DB Constraint greift nicht → kein Fehler

### Was sich NICHT aendert

- `lat` und `lng` kommen weiter von Google Places
- Radius-Suche nutzt nur lat/lng — kein postal_code
- Kanton-Filter bleibt gleich
- Profil-IDs, Slugs, Photos — alles bleibt 1:1 gleich
- Keine DB-Migration noetig
- Keine Schema-Aenderung
- Kein Constraint wird entfernt

Nur leerer String → NULL. Das wars.

