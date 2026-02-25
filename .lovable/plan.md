

## Plan: Veraltete Verifizierung bereinigen

### Problem

Profil "Test" zeigt ein Verifizierungs-Badge, obwohl nie ein Verifizierungsfoto eingereicht wurde. Das stammt vom alten System, wo Admins manuell eine Checkbox setzen konnten. `verified_at` ist auf `2026-02-02` gesetzt, aber in `verification_submissions` existiert kein Eintrag.

### Lösung

**1. Daten bereinigen (SQL-Migration)**

Alle Profile, die `verified_at` gesetzt haben aber KEINE genehmigte `verification_submissions` haben, werden zurückgesetzt:

```sql
UPDATE profiles
SET verified_at = NULL
WHERE verified_at IS NOT NULL
AND id NOT IN (
  SELECT profile_id FROM verification_submissions WHERE status = 'approved'
);
```

Das betrifft aktuell nur das Profil "Test" (`a34fb911...`).

**2. Kein Code-Änderung nötig**

Die bestehende Logik prüft bereits `verified_at` für das Badge. Sobald das Feld NULL ist, verschwindet das Badge. Der User kann dann über "Profil bearbeiten" die Verifizierung nachreichen.

### Risiko

Minimal. Nur Profile ohne echte Verifizierung verlieren das Badge. Profile mit genehmigter Submission behalten es.

