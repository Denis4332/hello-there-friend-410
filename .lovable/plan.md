

# Expiry-Filter in alle Such-Funktionen einbauen

## Was fehlt

3 Datenbank-Funktionen filtern noch nicht nach abgelaufenen Abonnements. Abgelaufene Profile erscheinen weiterhin auf Homepage, Suche, Stadt-/Kategorie-Seiten und GPS-Suche.

## Was gemacht wird

Eine einzige SQL-Migration die alle 3 Funktionen mit `CREATE OR REPLACE` aktualisiert. Der Expiry-Filter wird an jede `WHERE p.status = 'active'` Klausel angefuegt:

```text
AND (
  (p.listing_type = 'top' AND p.top_ad_until >= now())
  OR (p.listing_type <> 'top' AND p.premium_until >= now())
)
```

### Funktion A: `get_paginated_profiles`

- 2 Stellen: COUNT-Query (Zeile fuer v_total) und SELECT-Subquery
- Betrifft: Homepage, Suche, Stadt-Seiten, Kategorie-Seiten

### Funktion B: `search_profiles_by_radius` (8 Parameter, paginiert)

- 2 Stellen: COUNT-Query (Zeile fuer v_total) und SELECT-Subquery
- Betrifft: GPS-Suche V1 Fallback

### Funktion C: `search_profiles_by_radius_v2`

- 1 Stelle: `filtered` CTE WHERE-Klausel
- Betrifft: GPS-Suche Hauptfunktion

### Was sich NICHT aendert

- Keine Tabellen werden veraendert
- Keine Profile werden geloescht
- Frontend-Code bleibt identisch
- Sortierlogik (Tier-Order, Rotation) bleibt identisch
- Die 5-Parameter-Version von `search_profiles_by_radius` hat den Filter bereits

## Betroffene Dateien

- 1 neue SQL-Migration (3x CREATE OR REPLACE FUNCTION + NOTIFY)

## Ergebnis

Abgelaufene Profile werden automatisch aus allen Suchergebnissen ausgeblendet. Aktuell sind alle 9 Profile gueltig, daher aendert sich visuell nichts -- aber der Schutz ist aktiv sobald ein Abo auslaeuft.

## Wichtig

Bitte den Migrations-Button in der UI bestaetigen wenn er erscheint.
