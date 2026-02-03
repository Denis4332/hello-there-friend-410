
## Ziel (was danach garantiert funktionieren soll)
1. **Profil aktualisieren** löst immer sichtbar eine Aktion aus (entweder Speichern + Erfolg oder klare Fehlermeldung).
2. Wenn ein Profil **aktiv (grün)** ist und du **irgendeine Änderung** machst (Text, Kontakt, Kategorien, Fotos, Hauptfoto, Löschen), wird es **automatisch wieder „pending / in Prüfung“** – der **Bezahl-Status bleibt „bezahlt“**.
3. **Hauptfoto**: Wenn du ein neues Hauptfoto auswählst, bleibt nicht mehr das alte „ausgewählt“ und es gibt **nie zwei Hauptfoto-Sterne gleichzeitig**.
4. UI zeigt nach Änderungen **sofort konsistent** den echten Stand aus der Datenbank (keine „komisch übernommen / plötzlich wieder alt“ Effekte durch Cache/State).

---

## Ist-Zustand (kurze Diagnose anhand Code)
### A) Speichern wirkt wie “passiert nix”
- In `ProfileEdit.tsx` ist der Button korrekt mit `type="submit" form="profile-edit-form"`.
- Wenn “nix passiert”, ist es in React-Forms fast immer:
  1) **Validation blockt** (Zod/React-Hook-Form), aber der User sieht die Fehlermeldung nicht (z.B. weit oben im Form), oder  
  2) **Submit wird abgebrochen** (z.B. Modal/Overlay/disabled) ohne klares Feedback, oder  
  3) **Backend-Update scheitert** (RLS/DB), aber Error wird nicht sichtbar/verschluckt.

### B) Hauptfoto / Sterne doppelt ausgewählt
- `PhotoUploader.tsx` hat **zwei “Primary-Quellen”**:
  - Für bereits hochgeladene Medien: `currentPrimaryId` (DB-Primary)
  - Für neue (noch nicht hochgeladene) Medien: `primaryIndex` (lokaler State)
- Dadurch kann es real passieren, dass **ein DB-Primary** und **ein lokales Primary** gleichzeitig “markiert” sind → genau dein Screenshot/Problem.
- Zusätzlich: Neue Uploads werden aktuell **nicht automatisch** als Primary gesetzt, wenn schon Bilder existieren (Upload-Logik setzt `is_primary` nur bei ersten Bildern).

### C) Status “active (grün)” bleibt trotz Änderungen
- `handleFormSubmit` setzt bei active korrekt `status: 'pending'` (das ist gut).
- Aber bei **Medien-Änderungen** (Hauptfoto setzen, löschen, hochladen) wird Status derzeit **nicht zuverlässig** auf pending gesetzt (nur Draft→Pending beim ersten Foto).
- Ergebnis: Du änderst Foto/Hauptfoto → Profil bleibt grün, obwohl es eigentlich in Prüfung müsste.

### D) “Altes Foto bleibt / übernommen was vorher geändert”
- Sehr wahrscheinlich eine Mischung aus:
  - **Primary wurde nicht wirklich gewechselt** (nur UI-State, nicht DB oder nicht überall reloaded),
  - und/oder **Browser/Storage-Cache** (Bild-URLs ohne Cache-Buster),
  - und/oder PhotoUploader lädt existierende Previews nur beim Mount und “lebt dann weiter” ohne Hard-Refresh der Liste.

---

## Umsetzung (konkret, mit Files & Steps)

### 1) Speichern “unkaputtbar” machen (Form Submit + sichtbare Fehler)
**Dateien**
- `src/components/profile/ProfileForm.tsx`
- ggf. Sections (`BasicInfoSection`, `LocationSection`, …)
- `src/pages/ProfileEdit.tsx`

**Änderungen**
1. In `ProfileForm` einen **onInvalid Handler** ergänzen:
   - Wenn `handleSubmit` fehlschlägt (Validation), dann:
     - Toast: “Bitte prüfe die markierten Felder”
     - Automatisch zum **ersten Fehlerfeld scrollen** und es fokusieren.
2. Zusätzlich: Wenn Submit startet, kurz **UI-Feedback** (Spinner/Toast “Speichern…”), damit es niemals “nix” wirkt.
3. Debug nur temporär (optional): bei Submit Start/End in `ProfileEdit` `console.log` mit `profile.id`, `isActiveProfile`, `newStatus`, und bei Error die volle DB-Fehlermeldung.

**Ergebnis**
- Du bekommst immer entweder “gespeichert” oder eine klare Erklärung warum nicht.

---

### 2) Status-Regel sauber & einheitlich: Jede Änderung an aktivem Profil → pending
**Dateien**
- `src/pages/ProfileEdit.tsx`
- `src/components/profile/PhotoUploader.tsx` (nur Trigger/Callback, Status-Update aber besser zentral in ProfileEdit)

**Änderungen**
1. In `ProfileEdit` eine kleine Helper-Funktion:
   - `ensurePendingIfActive()`:
     - wenn `profile.status === 'active'`, dann `profiles.update({ status: 'pending' })`
     - **ohne** payment_status anzufassen.
2. Diese Funktion wird aufgerufen bei:
   - erfolgreichem `handleFormSubmit`
   - erfolgreichem `handleSetPrimary`
   - erfolgreichem `handleDeletePhoto`
   - erfolgreichem Upload-Complete (nach Upload)
3. Danach immer `loadData()` und UI aktualisieren.

**Ergebnis**
- Sobald du irgendwas änderst, geht grün → pending, aber bezahlt bleibt bezahlt.

---

### 3) Hauptfoto-Logik neu: “Single Source of Truth” + kein Doppelstern
**Dateien**
- `src/components/profile/PhotoUploader.tsx`
- `src/pages/ProfileEdit.tsx`

**Änderungen (Kern)**
1. **Nur eine Primary-Auswahl im UI**:
   - Entweder DB-Primary (`currentPrimaryId`) oder “pending primary for upload” – aber niemals beides gleichzeitig als “Hauptfoto” markiert.
2. Implementierungsvorschlag:
   - Neuer State in `PhotoUploader`: `pendingPrimaryLocalKey` (z.B. Preview-URL oder index), **nur für unuploaded**.
   - Anzeige-Regel:
     - Wenn es ein `currentPrimaryId` gibt (existierende Bilder):  
       - Sterne für uploaded richten sich nur nach `currentPrimaryId`.
       - Unuploaded Sterne zeigen “Wird Hauptfoto nach Upload” (andere Farbe/Icon), aber nicht als “Hauptfoto”.
     - Wenn kein `currentPrimaryId` (z.B. erstes Bild im Draft):  
       - dann nutzt man `primaryIndex` wie bisher.
3. Upload-Logik erweitern:
   - Wenn User ein unuploaded Preview als “soll Hauptfoto werden” markiert:
     - Beim Insert in `photos` `.select('id')` zurückgeben lassen.
     - Nach Upload: `onSetPrimary(newPhotoId)` aufrufen (damit DB-Primary wirklich umgestellt wird).
4. Nach `onSetPrimary`/`onUploadComplete`:
   - PhotoUploader muss seine Preview-Liste **neu synchronisieren**:
     - entweder über `key`-Remount (z.B. `key={profileId + ':' + currentPrimaryId + ':' + photosCount}` vom Parent)
     - oder `useEffect` in PhotoUploader, das bei Änderung von `currentPrimaryId` und/oder `profileId` die Photos neu lädt.

**Ergebnis**
- Du kannst zuverlässig ein neues Hauptfoto setzen.
- Es gibt nie wieder zwei Sterne als Hauptfoto.
- Nach Reload/Navigation bleibt die Auswahl korrekt.

---

### 4) “Altes Bild wird weiter angezeigt” verhindern (Cache Busting)
**Dateien**
- `src/components/profile/PhotoUploader.tsx`
- `src/pages/UserDashboard.tsx` (falls dort Fotos angezeigt werden)
- evtl. `src/components/ProfileCard.tsx`

**Änderungen**
1. Für Bild-URLs einen **Cache-Buster** anhängen (z.B. `?v=${photo.id}` oder `?v=${photo.updated_at || created_at}`).
2. Besonders beim Hauptfoto (weil das sich “ändert”, obwohl URL gleich aussehen kann).

**Ergebnis**
- Wenn du Hauptfoto wechselst, siehst du sofort das richtige Bild, nicht ein gecachtes.

---

### 5) Favoriten: falls du es noch siehst, ist es sehr wahrscheinlich PWA/Service-Worker Cache
Auch wenn wir Favoriten im Code entfernen: bei PWA kann das UI aus altem Cache kommen.

**Dateien**
- `vite.config.ts` / PWA config (vite-plugin-pwa)
- optional: kleines “Update verfügbar” Banner

**Änderungen**
1. PWA so konfigurieren, dass neue Deployments **sofort** aktiv werden:
   - `skipWaiting: true`, `clientsClaim: true`
2. Optional: beim Start prüfen ob ServiceWorker ein Update hat und eine Meldung “Neue Version verfügbar → Neu laden” anzeigen.

**Ergebnis**
- Du bekommst zuverlässig die neue Version, ohne dass alte Buttons/Seiten “noch da” wirken.

---

## Testplan (End-to-End, damit das wirklich stabil ist)
1. Profil ist **active** → Text ändern → “Profil aktualisieren” → Toast Erfolg → Dashboard zeigt **pending**.
2. Profil ist **active** → Hauptfoto wechseln (bei existierenden Bildern) → sofort UI korrekt → Dashboard zeigt **pending**.
3. Profil ist **active** → neues Foto hochladen + als Hauptfoto markieren → nach Upload ist es wirklich Hauptfoto → keine Doppelsterne.
4. Foto löschen → Status pending.
5. Browser Hard-Reload + nochmals prüfen, dass Favoriten wirklich weg sind und UI nicht aus Cache kommt.

---

## Risiken / Edge Cases die wir explizit abfangen
- Validation blockt still → wir erzwingen Toast + Scroll-to-error.
- Primary-Selection bei gemischten (uploaded + unuploaded) → wir trennen “Hauptfoto” vs “wird Hauptfoto nach Upload”.
- Race-Conditions (SetPrimary, UploadComplete, loadData) → wir serialisieren Updates und re-syncen Previews.
- Cache/PWA → wir sorgen für sofortige Aktivierung neuer Builds.

---

## Betroffene Dateien (Zusammenfassung)
- `src/pages/ProfileEdit.tsx` (Status-Pending bei allen Änderungen, Submit/Reload Flow)
- `src/components/profile/ProfileForm.tsx` (onInvalid: Toast + Scroll)
- `src/components/profile/PhotoUploader.tsx` (Primary-Logik, Upload->Primary, Sync, Cache-Buster)
- optional: `vite.config.ts` (PWA Update-Verhalten)
- optional: Foto-Anzeigen-Komponenten (`UserDashboard`, `ProfileCard`) für Cache-Buster

