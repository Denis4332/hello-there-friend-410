
# Expiry-Filter komplett durchsetzen

## Status jetzt
- public_profiles View: Hat Expiry-Filter (OK)
- get_paginated_profiles: KEIN Expiry-Filter (BUG - Homepage, Suche, Stadt, Kategorie betroffen)
- search_profiles_by_radius_v2: KEIN Expiry-Filter (BUG - GPS-Suche betroffen)  
- search_profiles_by_radius: KEIN Expiry-Filter (BUG - GPS-Fallback betroffen)
- useTopCities / useAllCities: Zaehlen abgelaufene Profile mit (BUG)
- generate-sitemap: Listet abgelaufene Profile (BUG)

## Was gemacht wird

### 1. Neue DB-Migration (ersetzt alle 3 Funktionen)

Die bestehende Migrations-Datei hat den korrekten Code, wurde aber nicht ausgefuehrt. Eine neue Migration wird erstellt die alle 3 Funktionen mit dem Expiry-Filter aktualisiert:

```text
AND (
  (p.listing_type = 'top' AND p.top_ad_until >= now())
  OR (p.listing_type <> 'top' AND p.premium_until >= now())
)
```

Betrifft:
- get_paginated_profiles (COUNT + SELECT)
- search_profiles_by_radius_v2 (filtered CTE)
- search_profiles_by_radius (beide Overloads: mit und ohne Pagination)

### 2. useTopCities und useAllCities (src/hooks/useProfiles.ts)

Aktuell:
```text
.from('profiles').select('city, canton').eq('status', 'active')
```

Neu:
```text
.from('public_profiles').select('city, canton')
```

Die View filtert bereits nach active + nicht abgelaufen.

### 3. generate-sitemap Edge Function

2 Queries umstellen von `profiles` auf `public_profiles`:
- Profil-Slugs fuer Sitemap-URLs
- Staedte fuer Sitemap-URLs

### Betroffene Dateien
- 1 neue SQL-Migration (3 Funktionen neu erstellen)
- src/hooks/useProfiles.ts (2 Hooks: useTopCities, useAllCities)
- supabase/functions/generate-sitemap/index.ts (2 Queries)

### Risiko
Minimal -- die Migration-Datei mit dem korrekten Code existiert bereits und wurde verifiziert. Die Hook-Aenderungen nutzen einfach die bereits funktionierende View.

### Wichtig
Diesmal bitte den Migrations-Button in der UI bestaetigen wenn er erscheint, damit die Aenderungen auch wirklich auf die Datenbank angewendet werden.
