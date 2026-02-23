

# ESCORIA Fix-Prompt V3 -- Kompletter 7-Phasen Umsetzungsplan

Hier ist der gesamte Plan aus deinem Dokument, Phase fuer Phase, mit allen betroffenen Dateien und genauen Aenderungen.

---

## Phase 1: Kanton-Filter Fix + SQL-Migration

**Ziel:** Datenbank bereinigen und Kanton-Filter auf der Suchseite reparieren.

### SQL-Migration (wird zuerst ausgefuehrt)

1. Alle alten Staedte loeschen
2. 26 Kantonshauptstaedte mit GPS einfuegen (Zuerich, Bern, Luzern, ... Delemont)
3. Kantonnamen in `profiles.canton` zu Abkuerzungen normalisieren ("Zuerich" -> "ZH", "Bern" -> "BE", etc.)
4. Duplikate in `verification_submissions` bereinigen + Unique Constraint `uq_verification_profile_id`
5. Performance-Indizes: `idx_cities_lat_lng`, `idx_profiles_canton`

### Code-Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useProfiles.ts` | Zeilen 83-95 (Canton-Name Lookup Block) loeschen. `p_canton: cantonName` ersetzen durch `p_canton: filters.location \|\| null` |

---

## Phase 2: Location-System vereinfachen

**Ziel:** Nominatim-Abhaengigkeit entfernen, Stadt-Dropdown durch Freitextfeld ersetzen.

| Datei | Aenderung |
|-------|-----------|
| `src/lib/geolocation.ts` | Komplett ersetzen: Nominatim entfernen, stattdessen Browser-GPS + naechste Stadt aus DB per Haversine-Formel finden, Kanton als Abkuerzung zurueckgeben |
| `src/lib/geocoding.ts` | Komplett ersetzen: Nominatim entfernen, DB-Lookup fuer Koordinaten per Kanton+Stadt, `geocodePlz` als leerer Stub behalten |
| `src/components/profile/sections/LocationSection.tsx` | Komplett ersetzen: Stadt-Combobox/Dropdown + alle Popover/Command-Imports entfernen, durch einfaches `<Input>` Freitextfeld ersetzen, PLZ editierbar machen (kein `readOnly` mehr), `useCitiesByCantonSlim` Import entfernen |
| `src/components/profile/ProfileForm.tsx` | `city` Validierung von `z.string().min(1, 'Stadt ist erforderlich')` zu `z.string().optional().default('')` aendern |

### Neue LocationSection UI-Struktur

```text
+----------------------------------+
| Kanton *          [Dropdown]     |
|           [Mein Standort Button] |
+----------------------------------+
| Stadt (optional)                 |
| [Freitext Input_______________]  |
+----------------------------------+
| PLZ / Adresse (optional)         |
| [Editierbares Input___________]  |
| "Wird nicht oeffentlich angezeigt"|
+----------------------------------+
```

---

## Phase 3: Payment Fix -- premium_until setzen

**Ziel:** Nach erfolgreicher Zahlung `premium_until` / `top_ad_until` korrekt setzen und Profil auf `active` stellen.

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/payport-return/index.ts` | Update-Block (Zeilen 260-270) erweitern: Profil laden (`listing_type`, `premium_until`, `top_ad_until`), Verlaengerungslogik (`calcNewExpiry` -- falls noch aktiv, ab aktuellem Ablaufdatum, sonst ab jetzt +30 Tage), `status: 'active'` setzen |

### Neue Update-Logik

```text
1. Profil laden (listing_type, premium_until, top_ad_until)
2. calcNewExpiry(currentExpiry):
   - Falls currentExpiry > now -> ab currentExpiry + 30 Tage
   - Sonst -> ab now + 30 Tage
3. Falls listing_type === 'top':
   - top_ad_until = calcNewExpiry(top_ad_until)
   - premium_until = gleicher Wert
4. Sonst:
   - premium_until = calcNewExpiry(premium_until)
5. status = 'active'
6. payment_status = 'paid'
```

---

## Phase 4: Verifikation -- Upsert-Loesung

**Ziel:** Pro Profil immer nur 1 Verifikations-Eintrag (Upsert statt delete+insert). Bereits genehmigte Verifikationen nicht mehr ueberschreibbar.

### SQL (bereits in Phase 1 Migration enthalten)
- Duplikate bereinigen + `UNIQUE (profile_id)` Constraint

### Code-Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/profile/VerificationUploader.tsx` | Komplett ersetzen: `useEffect` zum Pruefen des bestehenden Status, Upsert mit `onConflict: 'profile_id'` statt delete+insert, "approved" blockiert weitere Uploads (zeigt nur Badge), "pending" erlaubt Foto-Ersetzung (gleiche ID bleibt) |
| `src/pages/ProfileEdit.tsx` | Verifikations-Bereich bereits korrekt implementiert (zeigt Badge bei `verified_at`, sonst `VerificationUploader`) -- keine Aenderung noetig |
| `src/pages/admin/AdminProfile.tsx` | `dialogVerified` State + zugehoerige Checkbox (Zeile 58, 669, 782, 1516-1521) entfernen. Verifikation laeuft ausschliesslich ueber AdminVerifications-Tab |

---

## Phase 5: Branding / Favicon

**Ziel:** ESCORIA-Branding statt Herz-Icons.

| Datei | Aenderung |
|-------|-----------|
| `index.html` | `favicon-hearts.png` -> ESCORIA-Favicon (existierendes `/images/escoria-logo.png` oder neues Favicon), `apple-touch-icon-hearts.png` anpassen, `og:image` und `twitter:image` URLs aktualisieren (von gpt-engineer Storage auf eigenes Bild) |

---

## Phase 6: Google Places Autocomplete

**Ziel:** PLZ/Adress-Feld in LocationSection durch Google Places Autocomplete ersetzen.

**Voraussetzung:** `VITE_GOOGLE_PLACES_KEY` ist als Secret konfiguriert (bestaetigt vorhanden).

**Hinweis:** Der Key ist als Backend-Secret gespeichert, aber fuer Google Places Autocomplete muss er im Frontend verfuegbar sein (ueber `import.meta.env.VITE_GOOGLE_PLACES_KEY`). Die `.env` Datei wird automatisch verwaltet -- falls der Key dort nicht erscheint, greift der Fallback (normales Freitextfeld).

| Datei | Aenderung |
|-------|-----------|
| `package.json` | `@googlemaps/js-api-loader` als Abhaengigkeit hinzufuegen |
| `src/components/profile/sections/LocationSection.tsx` | (Wird bereits in Phase 2 vereinfacht) Google Autocomplete hinzufuegen: `useRef` + `useEffect` fuer Initialisierung, Beschraenkung auf Schweiz, automatische Extraktion von Kanton/PLZ/GPS aus `place.address_components`. Fallback auf normales `<Input>` wenn Key fehlt |

### Google Places Verhalten

```text
User tippt Adresse -> Google Vorschlaege (nur CH)
User waehlt Vorschlag ->
  1. Kanton wird automatisch gesetzt (administrative_area_level_1 -> Abkuerzung)
  2. PLZ wird automatisch ausgefuellt (postal_code)
  3. GPS-Koordinaten werden gesetzt (geometry.location)
  4. Adresse wird ins PLZ-Feld geschrieben

Fallback ohne API-Key:
  -> Normales Freitextfeld (wie in Phase 2)
  -> "Mein Standort" Button funktioniert weiterhin
```

---

## Phase 7: Aufraeumen -- alten Code entfernen

**Ziel:** Doppelte Exports bereinigen, nicht mehr benoetigte Edge Functions loeschen.

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Suche.tsx` (Zeile 9) | Import aendern: `from '@/hooks/useCitiesByCantonSlim'` -> `from '@/hooks/useCantons'` |
| `src/pages/Index.tsx` (Zeile 8) | Import aendern: `from '@/hooks/useCitiesByCantonSlim'` -> `from '@/hooks/useCantons'` |
| `src/pages/Kantone.tsx` (Zeile 9) | Import aendern: `from '@/hooks/useCitiesByCantonSlim'` -> `from '@/hooks/useCantons'` |
| `src/hooks/useCitiesByCantonSlim.ts` | `useCantons` Export loeschen (Zeilen 35-47). Nur `useCitiesByCantonSlim` + `CityWithCoordinates` bleiben (fuer `AdminProfileCreateDialog`) |
| Edge Functions loeschen | `geocode-all-profiles`, `import-all-swiss-cities`, `import-geonames-cities`, `import-swiss-cities` |

### Was NICHT geloescht wird
- `src/hooks/useCities.ts` -- wird von `Cities.tsx` und `Stadt.tsx` fuer SEO-Seiten gebraucht
- `src/hooks/useCitiesByCantonSlim.ts` -- wird von `AdminProfileCreateDialog` gebraucht (nur `useCantons` Export raus)
- `src/lib/geocoding.ts` -- bleibt (vereinfacht in Phase 2), `ProfileForm.tsx` importiert es noch

---

## Reihenfolge und Abhaengigkeiten

```text
Phase 1 (SQL-Migration + Filter-Fix)     <- MUSS ZUERST
    |
Phase 2 (Location vereinfachen)          <- Haengt von neuen cities-Daten ab
    |
Phase 3 (Payment Fix)                    <- Unabhaengig, aber logisch hier
    |
Phase 4 (Verifikation Upsert)            <- Braucht Unique Constraint aus Phase 1
    |
Phase 5 (Branding)                       <- Unabhaengig
    |
Phase 6 (Google Places)                  <- Baut auf Phase 2 LocationSection auf
    |
Phase 7 (Aufraeumen)                     <- Zuletzt, raumt Imports auf
```

---

## Was NICHT geaendert wird
- `ProfileEdit.tsx` Pending-Logik (bereits korrekt: `newStatus = wasActive ? 'pending' : freshProfile.status`)
- `ProfileCreate.tsx` (funktioniert korrekt)
- `payport-checkout` (funktioniert korrekt)
- Datenbank-Spalten/Typen bleiben bestehen
- `src/integrations/supabase/client.ts` und `types.ts` (automatisch generiert)

---

## Test-Checkliste (nach allen Phasen)
1. Kanton-Filter: `/suche` -> ZH waehlen -> Profile aus ZH erscheinen
2. GPS: Profil erstellen -> "Mein Standort" klicken -> Kanton wird gesetzt
3. Staedte-Dropdown: weg (nur noch Freitextfeld + optional Google Places)
4. Payment: Zahlung abschliessen -> `premium_until` wird um 30 Tage verlaengert, Profil aktiv
5. Verifikation: Foto hochladen -> Upsert (gleiche ID), approved nicht mehr aenderbar
6. Admin Verifikation: Keine Checkbox mehr im Profil-Dialog
7. Favicon: Kein Herz mehr, ESCORIA-Branding
8. Google Places: Adresse tippen -> Vorschlaege -> Kanton/PLZ/GPS automatisch

