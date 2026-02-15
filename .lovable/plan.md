

# Abgelaufene Profile automatisch ausblenden

## Uebersicht

Eine SQL-Migration aktualisiert 4 Datenbank-Objekte und eine kleine Aenderung im UserDashboard sorgt dafuer, dass der User informiert wird.

**Ergebnis**: Profil laeuft ab = sofort weg von der Seite. User sieht "abgelaufen" im Dashboard.

## Was geaendert wird

### 1. Datenbank-Migration (1 SQL-Datei, 4 Objekte)

Die Ablauf-Bedingung wird ueberall hinzugefuegt wo `status = 'active'` steht:

```text
AND (
  (listing_type = 'top' AND top_ad_until >= now())
  OR (listing_type != 'top' AND premium_until >= now())
)
```

**A) `public_profiles` View** -- Einzelprofil-Anzeige via Slug

**B) `get_paginated_profiles` Funktion** -- Homepage, Suche, Stadt, Kategorie (COUNT + SELECT)

**C) `search_profiles_by_radius_v2` Funktion** -- GPS-Suche V2 (filtered CTE)

**D) `search_profiles_by_radius` Funktion** -- GPS-Fallback (beide Versionen: mit und ohne Pagination)

### 2. UserDashboard.tsx -- Expiry-Check (ca. 15 Zeilen)

Nach dem Laden des Profils (Zeile 152) wird geprueft ob es abgelaufen ist:
- Falls ja: Status in DB auf `inactive` setzen
- Toast "Dein Inserat ist abgelaufen" anzeigen
- Lokalen State aktualisieren

### Betroffene Dateien
- 1 neue SQL-Migration
- `src/pages/UserDashboard.tsx` (Expiry-Check in `loadProfile`)

### Risiko
- Null: Der Trigger stellt bereits sicher, dass alle aktiven Profile ein Ablaufdatum haben
- Die bestehende Sortierlogik (Tier-Order) bleibt komplett erhalten
- Funktionssignaturen aendern sich nicht

