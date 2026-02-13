

# Fix: Profil-Löschung schlägt fehl wegen Storage-Trigger

## Problem
Beim Löschen eines Profils wird ein Datenbank-Trigger (`on_photo_delete`) ausgelöst, der versucht, Dateien direkt aus der internen `storage.objects`-Tabelle zu löschen. Das wird von der Datenbank blockiert mit der Meldung: "Direct deletion from storage tables is not allowed."

Die Edge Function `admin-delete-user` löscht die Fotos bereits korrekt über die Storage API (Schritt 10), bevor sie die `photos`-Datensätze entfernt. Der Trigger ist daher überflüssig und verursacht den Fehler.

## Lösung

### Schritt 1: Trigger und Funktion entfernen
Eine Datenbank-Migration erstellen, die:
1. Den Trigger `on_photo_delete` von der `photos`-Tabelle entfernt
2. Die Funktion `delete_storage_object()` löscht

Das ist sicher, weil beide Lösch-Funktionen (Admin und Self-Delete) die Fotos bereits über die Storage API entfernen, bevor die Datenbank-Einträge gelöscht werden.

### Technische Details

```text
Migration SQL:
  DROP TRIGGER IF EXISTS on_photo_delete ON public.photos;
  DROP FUNCTION IF EXISTS delete_storage_object();
```

Keine Code-Änderungen an der Edge Function nötig -- die aktuelle Logik ist korrekt.

