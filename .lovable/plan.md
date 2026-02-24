

# Fix: State-Merge überschreibt profile.id + Upsert-Fehler

## Deine Sorge ist berechtigt — deshalb hier der exakte Beweis warum NUR 2 Zeilen geändert werden und NICHTS anderes betroffen ist.

---

## Problem 1: Zeile 118 — `contactData.id` überschreibt `profile.id`

Aktuell:
```typescript
setProfile({ ...profileRes.data, ...contactData });
```

`contactData` kommt aus `profile_contacts` und hat ein eigenes `id`-Feld (z.B. `e4b3ad18-...`). Durch den Spread überschreibt es die echte Profil-ID (`217fbd22-...`). Das bedeutet:
- `profile.id` ist falsch → PhotoUploader bekommt falsche ID
- `handleUploadComplete` macht `.eq('id', profile!.id)` mit der FALSCHEN ID → Status-Update findet kein Match
- Canton/Stadt-Problem wird verschlimmert weil der ganze State inkonsistent ist

**Fix:** Nur `id` und `profile_id` aus contactData entfernen:
```typescript
const { id: _contactId, profile_id: _pid, ...contactFields } = contactData || {};
setProfile({ ...profileRes.data, ...contactFields });
```

**Was sich ändert:** NUR dass `profile.id` korrekt bleibt. Alle Contact-Felder (phone, email, whatsapp etc.) werden weiterhin gemerged. Kein anderer Code wird berührt.

## Problem 2: Zeile 218 — Upsert ohne onConflict

Aktuell:
```typescript
.upsert({ profile_id: profileId, email: data.email, ... });
```

`profile_contacts` hat eine unique constraint auf `profile_id`. Ohne `onConflict` kann es zu `duplicate key` Fehlern kommen.

**Fix:** Eine Option hinzufügen:
```typescript
.upsert({ ... }, { onConflict: 'profile_id' })
```

**Was sich ändert:** NUR dass das Upsert zuverlässiger funktioniert. Es macht exakt das gleiche — findet den existierenden Eintrag und updated ihn.

---

## Was wird NICHT angefasst

| Komponente | Änderung? |
|-----------|-----------|
| GPS-Suche/Filter | NEIN — lat/lng in DB und Suche bleiben identisch |
| Kanton-Dropdown/Auswahl | NEIN — LocationSection wurde bereits gefixt mit initializedRef |
| Google Places | NEIN — keine Änderung |
| PhotoUploader-Logik | NEIN — nur die ID die er bekommt ist jetzt korrekt |
| handleUploadComplete | NEIN — wurde bereits gefixt, funktioniert jetzt weil profile.id stimmt |
| Profil-Erstellung | NEIN — nutzt einen anderen Code-Pfad (ProfileCreate.tsx) |
| Admin-Bereich | NEIN — AdminProfile hat eigene Logik |
| Rotations-Algorithmus | NEIN — komplett anderer Code |
| RLS/Sicherheit | NEIN — keine DB-Änderungen |

## Dateien

| Datei | Zeile | Änderung |
|-------|-------|----------|
| `src/pages/ProfileEdit.tsx` | 118 | contactData destructuring (id/profile_id ausschliessen) |
| `src/pages/ProfileEdit.tsx` | 218 | `onConflict: 'profile_id'` hinzufügen |

**Nur 2 Zeilen in 1 Datei.** Kein neuer Code, keine neue Logik, keine Seiteneffekte.

