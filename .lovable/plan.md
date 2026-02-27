

## Ergebnis der Analyse: PostGIS kann sicher entfernt werden

### Beweis

1. **Alte Migration** (`20251028`) hat PostGIS installiert und `ST_Distance`/`ST_DWithin` verwendet
2. **Aktuelle Funktionen** (letzte Migration `20260215`) verwenden ausschliesslich die **Haversine-Formel** -- kein einziger `ST_*` Aufruf mehr:
   ```sql
   6371 * acos(cos(radians(user_lat)) * cos(radians(p.lat)) * ...)
   ```
3. **Kein Frontend-Code** ruft PostGIS-Funktionen auf -- nur `search_profiles_by_radius` und `search_profiles_by_radius_v2` via RPC, beide Haversine
4. Die Tabellen `geography_columns`, `geometry_columns`, `spatial_ref_sys` sind reine PostGIS-Systemtabellen -- keine App-Daten drin

### Was blockiert die Migration

Die alte Migration `20251028` enthalt `CREATE EXTENSION IF NOT EXISTS postgis;` -- wenn PostGIS auf dem Ziel-System nicht verfuegbar ist, schlaegt die gesamte Migration fehl.

### Plan

1. **Neue Migration erstellen** die PostGIS sauber entfernt:
   ```sql
   DROP EXTENSION IF EXISTS postgis CASCADE;
   ```
   `CASCADE` entfernt auch die System-Views (`geography_columns`, `geometry_columns`) automatisch.

2. **Alte Migration patchen** (Kommentar oder Entfernung von `CREATE EXTENSION IF NOT EXISTS postgis;`) -- damit bei einem frischen Setup PostGIS nicht mehr installiert wird. Da alte Migrationen nicht editiert werden koennen, reicht die neue DROP-Migration.

### Risiko

Null. Alle drei aktiven RPC-Funktionen (`search_profiles_by_radius`, `search_profiles_by_radius_v2`, `get_paginated_profiles`) nutzen ausschliesslich mathematische Standard-SQL-Funktionen (`acos`, `cos`, `sin`, `radians`) -- kein PostGIS noetig.

