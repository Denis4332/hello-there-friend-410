

## Risiko-Check: Expiry-Auto-Fix im Admin Dashboard

### Ist es gefaehrlich? NEIN.

Der Fix macht **exakt das Gleiche** wie zwei bereits existierende Mechanismen:

1. **UserDashboard.tsx (Zeile 153-164)** — Macht schon heute genau das: Wenn ein User sein Dashboard oeffnet und das Profil abgelaufen ist, wird `status` auf `inactive` gesetzt
2. **check-subscription-expiry Edge Function** — Macht dasselbe serverseitig fuer alle Profile

Der einzige Unterschied: Diese beiden Checks greifen nur wenn der **User** sein Dashboard oeffnet bzw. die Edge Function manuell aufgerufen wird. Wenn keiner das tut, bleibt das Profil im Limbo (`status='active'` aber tatsaechlich abgelaufen).

### Was der Fix macht

Am Anfang der Admin-Dashboard Stats-Query und der Admin-Profilliste:

```text
UPDATE profiles SET status = 'inactive'
WHERE status = 'active'
AND listing_type IN ('premium','basic') AND premium_until < NOW()

UPDATE profiles SET status = 'inactive'
WHERE status = 'active'
AND listing_type = 'top' AND top_ad_until < NOW()
```

Das ist **identische Logik** wie in UserDashboard.tsx und der Edge Function. Kein neues Verhalten, nur ein zusaetzlicher Ausloeser.

### Was NICHT kaputtgehen kann

- Profile die wirklich aktiv sind (Ablauf in der Zukunft) werden nicht beruehrt
- Profile ohne Ablaufdatum (`premium_until = NULL`) werden nicht beruehrt (weil `NULL < NOW()` ist `false`)
- Kein Einfluss auf IDs, Slugs, Photos, Kategorien
- Keine DB-Migration noetig
- Die oeffentliche Sichtbarkeit wird schon durch `public_profiles` View und `get_paginated_profiles` gefiltert — der Fix synchronisiert nur den `status` Wert

### Zusaetzlich: Filter "Abgelaufen" im Admin

Der Filter "Inaktiv" existiert bereits (Zeile 829). Ein abgelaufenes Profil IST inaktiv — nach dem Fix wird es dort korrekt angezeigt. Optional kann ich einen separaten Filter "Abgelaufen" hinzufuegen, der spezifisch Profile zeigt die `inactive` sind UND ein Ablaufdatum in der Vergangenheit haben (um sie von manuell deaktivierten zu unterscheiden).

### Aenderungen (2 Dateien)

| Datei | Aenderung |
|---|---|
| `AdminDashboard.tsx` | Expiry-Korrektur (2 UPDATE Queries) vor den Stats-Queries (~10 Zeilen) |
| `AdminProfile.tsx` | 1. Gleiche Expiry-Korrektur vor Profil-Query (~10 Zeilen) |
| | 2. Neuer Filter "Abgelaufen" in der Status-Dropdown (1 Zeile + Filter-Logik ~5 Zeilen) |

### Fazit

**Null Risiko.** Gleiche Logik die schon an 2 Stellen laeuft, wird einfach auch im Admin ausgefuehrt. Abgelaufene Profile werden korrekt als `inactive` markiert und im Filter sichtbar.

