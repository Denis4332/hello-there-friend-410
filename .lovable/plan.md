
## Diagnose (warum “nix passiert” + warum 2 goldene Sterne)

### 1) “Profil aktualisieren” macht scheinbar nichts
In den Console-Logs steht es schon klar:
- `[ProfileForm] Validation failed: gender: Expected string, received null`

Ursache im Code:
- In `ProfileForm.tsx` ist `gender: z.string().optional()`
- Beim Edit kommt aber sehr wahrscheinlich `profile.gender === null` aus der DB rein (in `ProfileEdit.tsx` wird `defaultValues.gender = profile.gender` gesetzt).
- `null` ist in Zod **nicht** “optional”, sondern ein eigener Typ → Validation blockt den Submit komplett.
- Ergebnis: kein Speichern, du bleibst auf der Seite, wirkt wie “es passiert nix”.

### 2) “Beide Bilder haben goldenen Stern”
In `PhotoUploader.tsx` ist die Primary-Logik aktuell:
- Für **uploaded** Previews: `return preview.id === currentPrimaryId;`
Problem:
- Bei frisch hochgeladenen Dateien setzen wir `uploaded: true`, aber **speichern keine `id`** zurück in `MediaPreview` (Insert macht kein `.select()`).
- Gleichzeitig ist `currentPrimaryId` manchmal kurz `undefined`/leer (Timing beim initialen Laden).
- Dann passiert: `undefined === undefined` → `true` → mehrere Sterne “aktiv”.

Zusätzlich lädt `PhotoUploader` eigene Previews aus der DB, aber beim Upload werden Previews nicht zuverlässig mit DB-IDs synchronisiert.

---

## Ziel (nach Fix garantiert)
1. Klick auf “Profil aktualisieren” führt immer zu:
   - gespeichert + Erfolgsmeldung, oder
   - klarer Fehler/Toast (und nicht “still”)
2. Keine Doppel-Sterne mehr: Es kann **maximal 1 Hauptfoto** “gold” sein.
3. Uploads bekommen nach dem Speichern echte DB-IDs im UI → Primary-Status ist stabil.
4. Wenn Profil aktiv war: jede Änderung (Form + Fotos + Hauptfoto + Löschen) setzt Status sauber auf `pending`, Payment bleibt `paid` (dein gewünschtes Verhalten ist in `ProfileEdit.tsx` schon weitgehend vorhanden; wir stellen nur sicher, dass es nicht durch Validation/Sync verhindert wird).

---

## Umsetzung (konkret, Dateien + Schritte)

### A) Fix für “nix passiert”: `gender` Validation robust machen
**Datei:** `src/components/profile/ProfileForm.tsx`  
**Änderung:**
- `gender` Schema so anpassen, dass `null`, `""` und `undefined` akzeptiert werden.
- Empfohlen: `z.preprocess`:
  - Wenn `null` oder `""` → `undefined`
  - Dann `z.string().optional()`

**Zusätzlich (zur Stabilität):**
- In `ProfileEdit.tsx` beim `defaultValues` sicherstellen:
  - `gender: profile.gender ?? ''` oder `undefined` (je nachdem, was wir im Schema wählen)

**Ergebnis:**
- Submit wird nicht mehr blockiert nur weil `gender` aus DB `null` ist.
- “Profil aktualisieren” funktioniert wieder.

---

### B) Fix für Doppel-Sterne: `isPrimaryPhoto()` gegen `undefined === undefined` absichern
**Datei:** `src/components/profile/PhotoUploader.tsx`  
**Änderung:**
- In `isPrimaryPhoto` bei `preview.uploaded === true`:
  - Wenn `!preview.id` oder `!currentPrimaryId` → **return false**
  - Erst vergleichen, wenn beide IDs sicher vorhanden sind.

**Ergebnis:**
- Kein Bild kann “primary” sein, wenn die IDs nicht sauber gesetzt sind.
- Doppelstern-Bug verschwindet sofort.

---

### C) Upload-Sync: Beim Insert DB-ID zurückholen und Preview updaten
**Datei:** `src/components/profile/PhotoUploader.tsx`  
**Problem aktuell:** Insert macht nur `.insert(...)` ohne `.select()`, daher hat UI keine `photo.id`.  
**Änderung:**
- Beim Insert in `photos`:
  - `.insert({...}).select('id, is_primary, media_type, storage_path').single()` (oder `maybeSingle` + Guard)
- Danach beim `setPreviews(...)`:
  - Für das passende Preview-Element:
    - `id: inserted.id`
    - `uploaded: true`
    - `url: …` (wie bisher)
- Optional: nach Upload Complete einmal DB-Reload (oder Parent `loadData()`) ist schon da, aber wichtig ist: UI hat IDs sofort.

**Ergebnis:**
- Uploaded Previews haben echte DB-IDs → `onSetPrimary(preview.id)` funktioniert zuverlässig.
- Primary-Anzeige wird stabil.

---

### D) Pending-Status nach Änderungen: sicherstellen, dass Foto-Aktionen immer `pending` triggern
**Datei:** `src/pages/ProfileEdit.tsx`  
**Check/Feinschliff:**
- `ensurePendingIfActive()` existiert bereits und wird aufgerufen in:
  - `handleSetPrimary`
  - `handleDeletePhoto`
  - `handleUploadComplete`
- Für Form-Submit ist der Statuswechsel schon in `handleFormSubmit` über `newStatus`.

**Was wir ergänzen/verbessern:**
- Nach erfolgreichem Speichern nicht nur `navigate('/mein-profil')`, sondern vorher sicherstellen:
  - `await loadData()` oder `navigate` mit anschließender Dashboard-Reload-Mechanik (damit du den pending-status sofort siehst)
- `currentPrimaryId` Prop stabilisieren:
  - `currentPrimaryId={photos.find(p => p.is_primary)?.id ?? undefined}` (explizit)
  - Key ist schon vorhanden, das ist gut.

**Ergebnis:**
- Sobald es wirklich speichert, geht “grün” zuverlässig zurück auf “pending”.

---

## Testplan (damit wir es final abhaken)
1) Auf `/profil/bearbeiten`: direkt “Profil aktualisieren” klicken  
- Erwartung: Speichern klappt (kein gender-null Fehler mehr)

2) Profil aktiv (grün) → Text ändern → speichern  
- Erwartung: Toast sagt “erneut geprüft”, Dashboard zeigt `pending`, Payment bleibt “bezahlt”

3) In Medien: 2 Bilder vorhanden → Bearbeiten öffnen  
- Erwartung: genau 1 goldener Stern (nie 2)

4) Neues Bild hochladen, danach Hauptfoto wechseln  
- Erwartung: Stern wechselt sauber, keine doppelten goldenen Sterne, UI bleibt konsistent

---

## Betroffene Dateien
- `src/components/profile/ProfileForm.tsx` (gender null/empty robust machen)
- `src/pages/ProfileEdit.tsx` (defaultValues.gender stabilisieren; optional Reload nach Save)
- `src/components/profile/PhotoUploader.tsx` (Primary-Guard + Insert `.select()` + Preview-ID Sync)
