
# Security Linter ERRORS beheben - Sicherer Fix-Plan

## Aktuelle Situation (nach Analyse)

### ERROR 1: Security Definer View - `public_profiles`
**Status: FALSE POSITIVE - Bereits korrekt!**

Die View hat bereits `security_invoker=true`:
```sql
-- Query-Ergebnis zeigt:
reloptions: [security_invoker=true]
```

**Warum der Linter trotzdem warnt:**
- Der Linter erkennt Views ohne `SECURITY INVOKER` explizit in der Definition
- Aber die Option IST gesetzt (via `reloptions`)
- Die View ist sicher: Sie verwendet RLS des aufrufenden Users, nicht des Erstellers

**Aktion:** Keine Änderung nötig. View recreaten mit explizitem `SECURITY INVOKER` im DDL entfernt die Warnung.

---

### ERROR 2: RLS Disabled - `spatial_ref_sys`
**Status: PostGIS Systemtabelle - kein Sicherheitsrisiko**

| Eigenschaft | Wert |
|-------------|------|
| Tabelle | `public.spatial_ref_sys` |
| Zeilen | 8.500 (Koordinatensystem-Definitionen) |
| Sensible Daten | ❌ Nein (nur EPSG/SRID Codes) |
| Von App genutzt | ❌ Nein (nur intern von PostGIS) |

**Warum RLS fehlt:**
- PostGIS erstellt diese Tabelle automatisch
- Enthält nur öffentliche Geodaten-Standards (EPSG Codes)
- Keine Benutzerdaten, keine sensiblen Informationen

---

## Sicherer Fix-Plan

### Fix 1: `public_profiles` View - Explizites `SECURITY INVOKER`

```sql
-- View neu erstellen mit explizitem SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT 
  id,
  slug,
  display_name,
  age,
  gender,
  city,
  canton,
  postal_code,
  lat,
  lng,
  about_me,
  languages,
  is_adult,
  verified_at,
  status,
  listing_type,
  premium_until,
  top_ad_until,
  created_at,
  updated_at
FROM profiles
WHERE status = 'active';

-- Grant SELECT to anon and authenticated
GRANT SELECT ON public.public_profiles TO anon, authenticated;
```

**Risiko:** Minimal - gleiche Definition, nur explizite Syntax
**Was könnte kaputt gehen:** Nichts - View-Definition ist identisch
**Testplan:**
1. Homepage öffnen → Profile werden angezeigt
2. /suche öffnen → Profile werden angezeigt
3. /profil/:slug öffnen → Profil-Detail funktioniert

---

### Fix 2: `spatial_ref_sys` - RLS aktivieren mit Public Read

```sql
-- RLS aktivieren auf PostGIS Systemtabelle
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Öffentlichen Lesezugriff erlauben (ist ohnehin nur Geodaten)
CREATE POLICY "Public can read spatial reference systems"
ON public.spatial_ref_sys
FOR SELECT
USING (true);
```

**Risiko:** Minimal - Tabelle wird von App nicht direkt genutzt
**Was könnte kaputt gehen:** 
- GPS-Suche nutzt PostGIS Funktionen, die intern auf spatial_ref_sys zugreifen
- Diese Funktionen laufen mit DB-Owner Rechten, nicht über RLS
**Testplan:**
1. GPS-Suche: Standort freigeben → Ergebnisse erscheinen
2. Radius ändern → Ergebnisse aktualisieren
3. Pagination durchklicken → Funktioniert

---

## WARNINGS (Keine Aktion nötig)

### 4x "RLS Policy Always True" - Absichtlich für Tracking

| Tabelle | Policy | Warum korrekt |
|---------|--------|---------------|
| `analytics_events` | INSERT true | Anonymes Tracking erlaubt |
| `profile_views` | INSERT true | View-Counter ohne Login |
| `search_queries` | INSERT true | Suchstatistiken anonym |
| `error_logs` | INSERT true | Fehler-Logging ohne Auth |

**Aktion:** Keine - dies sind absichtlich öffentliche INSERT-Policies für Analytics.

---

### Function Search Path Mutable - PostGIS Funktionen

Diese Warnungen betreffen hunderte PostGIS-interne Funktionen (`_st_contains`, `_st_intersects`, etc.).

**Aktion:** Keine - PostGIS-Extension verwaltet diese Funktionen selbst.

---

### Extension in Public - PostGIS

| Extension | Warnung |
|-----------|---------|
| `postgis` | In public schema |
| `postgis_topology` | In public schema |
| `fuzzystrmatch` | In public schema |

**Aktion:** Keine für Soft-Launch. Migration zu `extensions` Schema ist breaking change.

---

## Zusammenfassung

| Problem | Fix | Risiko | Launch-Blocker |
|---------|-----|--------|----------------|
| Security Definer View | View recreaten mit explizitem SECURITY INVOKER | Minimal | ❌ Nein (bereits sicher) |
| RLS Disabled spatial_ref_sys | RLS + Public SELECT Policy | Minimal | ❌ Nein (keine Userdaten) |
| 4x Always True INSERT | Keine Aktion | - | ❌ Nein (absichtlich) |
| Function Search Path | Keine Aktion | - | ❌ Nein (PostGIS intern) |
| Extension in Public | Keine Aktion | - | ❌ Nein (breaking change) |

---

## Erwarteter Ready-Score nach Fix

| Kategorie | Vorher | Nachher |
|-----------|--------|---------|
| Security | 2/10 | 7/10 |
| **Gesamt** | **72/100** | **82/100** |

Die verbleibenden Warnings (PostGIS, Analytics INSERT) sind **absichtlich** und keine echten Risiken.

---

## Testplan nach Migration

```text
1. Homepage (/) → Profile laden ✓
2. /suche → Text-Suche funktioniert ✓
3. /suche + GPS → Standort + Radius + Ergebnisse ✓
4. /profil/:slug → Profil-Detail öffnet ✓
5. /auth → Login funktioniert ✓
6. /mein-profil → Dashboard lädt ✓
```

---

## Technische Details

**Dateien die NICHT geändert werden:**
- `src/hooks/useProfiles.ts` (GPS-Logik)
- `supabase/functions/payport-*` (Payment)
- `src/lib/profileUtils.ts` (Tier-Reihenfolge)
- `useRotationKey.ts` (Rotation)

**Nur DB-Migration:**
- 1x DROP/CREATE VIEW
- 1x ALTER TABLE ENABLE RLS
- 1x CREATE POLICY

