

## Risikoanalyse: Was kann kaputtgehen?

Ich habe alle betroffenen Dateien genau geprüft. Hier die ehrliche Einschätzung:

### Was bereits funktioniert und NICHT angefasst wird

| Komponente | Datei | Wird geändert? |
|---|---|---|
| Dashboard-Deduplizierung | `AdminDashboard.tsx` | NEIN |
| Profil-Rotation (MurmurHash3) | diverse | NEIN |
| Öffentliche Sichtbarkeit (public_profiles) | DB View | NEIN |
| Suche / Filter / GPS | diverse | NEIN |
| Auth / Login / Signup | diverse | NEIN |
| CMS-Settings Integration | diverse | NEIN |
| User Dashboard Anzeige | `UserDashboard.tsx` | NEIN |
| ProfileCards / Grid-Design | diverse | NEIN |

### Was geändert wird und welches Risiko besteht

---

**Fix 1: `payport-return/index.ts` — Status-Logik**

Was genau passiert:
- Zeile 172: `status` wird zum SELECT hinzugefügt
- Zeile 183: Statt `status: 'active'` wird eine Bedingung eingebaut

Konkretes Risiko: **Sehr niedrig.** Der einzige Fall, wo sich das Verhalten ändert: Ein Profil mit `status: 'pending'` oder `rejected` bezahlt — bisher wurde es sofort `active`, neu bleibt es `pending`/`rejected`. Das ist gewollt.

Was könnte kaputtgehen: Nichts. Für bestehende aktive Profile (Verlängerung) und inaktive Profile (Reaktivierung) ändert sich das Verhalten NICHT. Die `premium_until`/`top_ad_until`-Berechnung bleibt identisch.

Rückgängig machbar: Ja, eine Zeile ändern.

---

**Fix 2: `ProfileUpgrade.tsx` + `payport-checkout/index.ts` — listing_type serverseitig**

Was genau passiert:
- `ProfileUpgrade.tsx` Zeilen 121-127: Der DB-Update `listing_type` wird entfernt
- `ProfileUpgrade.tsx` Zeile 131-138: `listingType` wird als Parameter an die Edge Function mitgegeben
- `payport-checkout/index.ts`: Nimmt `listingType` entgegen und setzt es im DB-Update (Zeile ~117)

Konkretes Risiko: **Niedrig-Mittel.** Das ist die grösste Änderung.

Was könnte kaputtgehen:
- `UserDashboard.tsx` (Zeile 44-57) ruft `payport-checkout` OHNE `listingType` auf — das ist OK, weil der Checkout dann einfach kein listing_type-Update macht (Verlängerung des bestehenden Pakets)
- Falls `listingType` nicht ankommt in der Edge Function, wird einfach kein Update gemacht — das bestehende Paket bleibt erhalten

Rückgängig machbar: Ja, `listingType`-Parameter wieder entfernen.

---

**Fix 3: `payport-checkout/index.ts` — Medien-Validierung**

Was genau passiert: Ein zusätzlicher Check wird VOR dem Checkout eingefügt.

Konkretes Risiko: **Sehr niedrig.** Rein additiver Code. Bestehende Logik wird nicht verändert.

Was könnte kaputtgehen: Wenn die `photos`-Tabelle nicht erreichbar ist, könnte ein Checkout fälschlich blockiert werden. Aber: Das gleiche Query funktioniert bereits im Frontend (`ProfileUpgrade.tsx` Zeile 79-87).

---

**Fix 4: `check-subscription-expiry/index.ts` — Expiry nicht nullen**

Was genau passiert: 3 Zeilen werden entfernt (`premium_until: null` und `top_ad_until: null`).

Konkretes Risiko: **Nahe null.** Die `public_profiles` View und alle Such-Funktionen filtern nach Datum (`premium_until > now()`), nicht nach `IS NOT NULL`. Ein abgelaufenes Datum hat denselben Effekt wie `null`.

Was könnte kaputtgehen: Nichts Sichtbares. Der User Dashboard Expiry-Check (Zeile 154-157) vergleicht bereits gegen `new Date()`, also funktioniert das auch mit einem abgelaufenen Datum.

---

### Zusammenfassung

| Fix | Risiko | Kann bestehende Fixes kaputt machen? |
|---|---|---|
| 1. Status-Logik | Sehr niedrig | Nein |
| 2. listing_type serverseitig | Niedrig-Mittel | Nein |
| 3. Medien-Validierung | Sehr niedrig | Nein |
| 4. Expiry beibehalten | Nahe null | Nein |

**Keine der 4 Änderungen berührt `AdminDashboard.tsx`, `UserDashboard.tsx` (ausser indirekt über die Edge Functions), die Suche, die Rotation, die ProfileCards oder die CMS-Integration.**

---

### Genaue Testanleitung nach Umsetzung

**Test 1: Dashboard-Deduplizierung (Bestätigung dass es noch funktioniert)**
1. Gehe zu `/admin/dashboard`
2. Prüfe: "Zu prüfen" zeigt korrekte Zahl (aktuell 0)
3. Fertig — wenn die Zahl stimmt, ist der Dashboard-Fix intakt

**Test 2: Fix 1 — Status-Logik bei Zahlung**
1. Im Admin: Setze ein Test-Profil auf `status: 'pending'`, `payment_status: 'pending'`
2. Gehe als User auf `/mein-profil` → "Jetzt bezahlen" klicken
3. Zahlung durchführen (Test-Modus)
4. Nach Rückkehr prüfen: `status` muss immer noch `pending` sein (NICHT `active`)
5. `payment_status` muss `paid` sein
6. Im Admin-Dashboard: Das Profil erscheint unter "Zu prüfen"
7. Admin aktiviert das Profil manuell → Profil wird sichtbar

**Test 3: Fix 2 — listing_type nur nach Checkout**
1. Erstelle ein inaktives Profil oder nutze ein abgelaufenes
2. Gehe zu `/profil/upgrade`
3. Wähle ein anderes Paket (z.B. Premium statt Basic)
4. Prüfe in der Datenbank VOR der Zahlung: `listing_type` muss sich bereits geändert haben (weil payport-checkout es setzt)
5. Breche die Zahlung ab (Fenster schliessen)
6. Prüfe: `listing_type` wurde durch `payport-checkout` gesetzt, aber `payment_status` ist `pending` — das Profil ist NICHT aktiv, also kein Exploit

**Test 4: Fix 3 — Medien-Validierung serverseitig**
1. Lade 6 Fotos in ein Test-Profil hoch
2. Versuche das Basic-Paket zu wählen (erlaubt max. 5)
3. Frontend sollte Fehlermeldung zeigen ("Zu viele Medien")
4. Falls jemand den Frontend-Check umgeht: Der Server blockiert den Checkout ebenfalls

**Test 5: Fix 4 — Expiry-Datum bleibt erhalten**
1. Rufe die Edge Function `check-subscription-expiry` auf
2. Ein abgelaufenes Profil wird `inactive`
3. Prüfe in der Datenbank: `premium_until` hat noch einen Wert (nicht null)
4. Das Profil ist trotzdem nicht mehr öffentlich sichtbar (public_profiles View filtert)

**Test 6: Gesamtcheck — Öffentliche Sichtbarkeit**
1. Öffne die Startseite als nicht eingeloggter User
2. Aktive Profile müssen sichtbar sein
3. Inaktive/pending Profile dürfen NICHT sichtbar sein
4. Suche funktioniert weiterhin

