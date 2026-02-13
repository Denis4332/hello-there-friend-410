
# Fix: Slug-Stabilität bei Profil-Bearbeitung

## Problem
Bei jeder Profil-Bearbeitung (Name oder Stadt ändern) wird die Profil-URL komplett neu generiert mit einem zufälligen Suffix. Das bricht alle bestehenden Links und SEO-Rankings.

**Beispiel:**
- Vorher: `/profil/anna-zuerich-a1b2c3d4`
- Nach Bearbeitung: `/profil/anna-zuerich-x9y8z7w6` (neuer Zufallswert!)

## Lösung

### Schritt 1: Slug-Trigger stabilisieren (Datenbank-Migration)

Den `generate_profile_slug()` Trigger so anpassen, dass:
1. **Bei INSERT**: Slug wird wie bisher generiert (Name + Stadt + zufälliger Suffix)
2. **Bei UPDATE**: Slug wird nur regeneriert wenn Name oder Stadt sich tatsächlich ändern, und der Suffix wird **deterministisch** aus der Profil-ID abgeleitet (`md5(NEW.id::text)`) statt aus `random()`. So bleibt der Suffix bei mehrfachen Bearbeitungen stabil.

```text
Migration SQL:
  CREATE OR REPLACE FUNCTION public.generate_profile_slug()
    -- Bei INSERT: random suffix (wie bisher)
    -- Bei UPDATE: suffix basiert auf profile.id (deterministisch/stabil)
    -- Slug ändert sich NUR wenn Name oder Stadt sich ändern
```

### Schritt 2: Sicherheit -- Profil-Update validiert gegen frische DB-Daten

In `ProfileEdit.tsx` vor dem Update die aktuelle Profil-ID aus der Datenbank holen (wie es der PhotoUploader bereits tut), um sicherzustellen, dass keine veraltete ID verwendet wird.

Das betrifft:
- `handleFormSubmit` -- Fresh profile ID aus DB holen
- `handleDeletePhoto` -- Bereits korrekt (nutzt `profile.id` aus geladenem State)
- `handleSetPrimary` -- Bereits korrekt

### Technische Details

**Migration:**
```text
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  base_slug := lower(
    regexp_replace(
      unaccent(NEW.display_name || '-' || COALESCE(NEW.city, 'schweiz')),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  base_slug := trim(both '-' from base_slug);

  IF TG_OP = 'INSERT' THEN
    -- New profile: random suffix
    final_slug := base_slug || '-' || substr(md5(random()::text), 1, 8);
  ELSE
    -- Update: deterministic suffix from profile ID (stable!)
    final_slug := base_slug || '-' || substr(md5(NEW.id::text), 1, 8);
  END IF;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;
```

**ProfileEdit.tsx -- Fresh ID Check:**
Vor dem Profil-Update wird die aktuelle Profil-ID frisch aus der DB geholt, um veraltete React-State-Daten auszuschliessen. Pattern identisch zum PhotoUploader (Zeilen 188-209).

### Was sich fuer den Nutzer aendert
- Profil-URL bleibt stabil bei normalen Bearbeitungen (z.B. About Me aendern)
- URL aendert sich nur noch wenn Name oder Stadt geaendert werden, und dann mit einem stabilen Suffix
- Keine gebrochenen Links mehr nach Bearbeitung
