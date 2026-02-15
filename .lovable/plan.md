

# Fix: Doppelte Funktionen entfernen

## Was ist passiert

Die letzte Migration hat neue Versionen der Such-Funktionen erstellt (mit `bigint` Typ und Expiry-Filter), aber die alten Versionen (mit `integer` Typ) wurden nicht entfernt. Jetzt existieren jeweils zwei fast identische Funktionen parallel. Die Datenbank kann beim Aufruf nicht entscheiden welche gemeint ist und gibt einen Fehler zurueck. Deshalb ist die Homepage leer.

**Alle Profile, Fotos und Daten sind sicher** -- es ist nur ein Routing-Problem.

## Aktueller Zustand (Duplikate)

```text
get_paginated_profiles:
  1. ALT: p_rotation_seed integer  ← muss weg
  2. NEU: p_rotation_seed bigint   ← bleibt (hat Expiry-Filter)

search_profiles_by_radius (paginiert):
  1. ALT: p_rotation_seed integer  ← muss weg
  2. NEU: p_rotation_seed bigint   ← bleibt (hat Expiry-Filter)

search_profiles_by_radius_v2:
  1. ALT: p_rotation_seed integer  ← muss weg
  2. NEU: p_rotation_seed bigint   ← bleibt (hat Expiry-Filter)
```

## Was gemacht wird

### 1. SQL-Migration: Alte Duplikate entfernen

Genau 3 DROP-Befehle fuer die alten integer-Versionen:

```text
DROP FUNCTION IF EXISTS get_paginated_profiles(integer, integer, integer, text, text, uuid, text);
DROP FUNCTION IF EXISTS search_profiles_by_radius(numeric, numeric, numeric, uuid, text, integer, integer, integer);
DROP FUNCTION IF EXISTS search_profiles_by_radius_v2(numeric, numeric, numeric, uuid, text, integer, integer, integer);
```

Plus ein Schema-Cache-Reload:

```text
NOTIFY pgrst, 'reload schema';
```

### 2. Keine weiteren Aenderungen

- Keine Tabellen werden veraendert
- Keine Profile werden geloescht
- Profil-IDs bleiben identisch
- Fotos, Kategorien, User-Accounts: alles unberuehrt
- Frontend-Code: keine Aenderungen noetig
- Die alten Radius-Funktionen ohne Pagination bleiben ebenfalls erhalten (kein Duplikat-Problem dort)

## Betroffene Dateien

- 1 neue SQL-Migration (nur DROP + NOTIFY)

## Ergebnis

Alle 9 aktiven Profile erscheinen sofort wieder auf der Homepage, mit dem Expiry-Filter aktiv.

## Wichtig

Bitte den Migrations-Button in der UI bestaetigen wenn er erscheint.

