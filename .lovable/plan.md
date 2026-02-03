

## Problem gefunden: Doppelte Primary-Flags in Datenbank

Ich habe die Datenbank geprüft und das Problem ist klar:

**Dein Profil (06a895a5-...) hat 2 Fotos, die BEIDE als `is_primary=true` markiert sind!**

Das ist ein Daten-Problem, kein reines Code-Problem. Der Code-Fix (Guard gegen `undefined === undefined`) ist bereits da, aber er schützt nur gegen fehlende IDs - nicht gegen echte doppelte Primaries in der DB.

---

## Lösung in 3 Schritten

### 1) Sofort-Fix: Doppelte Primaries in DB bereinigen
Wir führen eine DB-Migration durch, die alle doppelten `is_primary=true` auf `false` setzt (ausser das neueste Foto pro Profil).

### 2) Dauerhafter Schutz: Unique Partial Index
Wir erstellen einen Unique-Index in der DB, der **nur ein** `is_primary=true` pro `profile_id` erlaubt. Dann kann es nie wieder doppelte Primaries geben.

### 3) handleSetPrimary verbessern
Wir stellen sicher, dass `handleSetPrimary` in einer Transaktion arbeitet und Race-Conditions verhindert.

---

## Technische Details

### DB Migration (2 Schritte)

**Schritt 1: Bereinigung existierender Duplikate**
```sql
-- Setze alle is_primary auf false AUSSER dem neuesten pro Profil
UPDATE photos p1
SET is_primary = false
WHERE is_primary = true
  AND id != (
    SELECT id FROM photos p2
    WHERE p2.profile_id = p1.profile_id
      AND p2.is_primary = true
    ORDER BY created_at DESC
    LIMIT 1
  );
```

**Schritt 2: Unique Partial Index**
```sql
-- Verhindere künftig doppelte Primaries
CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_single_primary 
ON photos (profile_id) 
WHERE is_primary = true AND media_type = 'image';
```

### Code-Änderung: handleSetPrimary robuster machen
In `ProfileEdit.tsx` wird die Reihenfolge angepasst:
- Erst alle auf `false` setzen (mit explizitem Filter `is_primary = true`)
- Dann das gewählte auf `true` setzen
- Dann `loadData()` aufrufen

---

## Dateien

| Datei | Änderung |
|-------|----------|
| DB Migration | Bereinigung + Unique Index |
| `src/pages/ProfileEdit.tsx` | `handleSetPrimary` robuster |

---

## Was danach garantiert funktioniert

1. **Genau 1 goldener Stern** pro Profil (nie mehr 2)
2. **"Profil aktualisieren"** funktioniert (gender-Fix ist bereits aktiv)
3. **Hauptfoto wechseln** ist zuverlässig (DB-Index verhindert Race-Conditions)

