
# Fix: Zweiter Storage-Trigger auf profiles-Tabelle entfernen

## Problem
Es gibt einen weiteren Trigger `trigger_delete_profile_photos` auf der **profiles**-Tabelle (nicht photos!), der beim Löschen eines Profils die Funktion `delete_profile_photos()` aufruft. Diese Funktion versucht direkt aus `storage.objects` zu löschen:

```text
DELETE FROM storage.objects WHERE bucket_id = 'profile-photos' AND name IN (...)
```

Das wird von der Datenbank blockiert: "Direct deletion from storage tables is not allowed."

Der vorherige Fix hat nur den Trigger auf der `photos`-Tabelle entfernt -- dieser zweite Trigger auf `profiles` war die eigentliche Ursache.

## Lösung

### Datenbank-Migration
Trigger und Funktion entfernen:

```text
DROP TRIGGER IF EXISTS trigger_delete_profile_photos ON public.profiles;
DROP FUNCTION IF EXISTS delete_profile_photos();
```

Das ist sicher, weil die Edge Function `admin-delete-user` bereits:
1. Fotos über die Storage API löscht (Schritt 10)
2. Photo-Datensätze aus der DB entfernt (Schritt 11)
3. Erst danach das Profil löscht (Schritt 12)

Keine Code-Änderungen nötig.
