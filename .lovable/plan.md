
# Analyse: Offene Probleme und Verbesserungen

## Gefundene Probleme

### 1. KRITISCH: 30 aktive Basic-Profile ohne Zahlung
In der Datenbank befinden sich **30 aktive Profile** mit `listing_type = 'basic'` und `payment_status = 'pending'` -- also aktiv geschaltet, aber nie bezahlt und ohne Ablaufdatum (`premium_until = NULL`). Diese Profile haben keinen Ablaufmechanismus und bleiben ewig aktiv. Das muss bereinigt werden -- entweder auf `free` setzen (falls gewollt) oder deaktivieren.

### 2. Admin-Filter: "Inaktiv" fehlt
Im Admin-Profil-Filter (`AdminProfile.tsx`, Zeile 828-832) fehlt die Option `inactive`. Der Admin kann abgelaufene/inaktive Profile nur ueber "Alle" finden. Ein eigener Filter `<option value="inactive">Inaktiv</option>` wird benoetigt.

### 3. Admin-Filter: "Draft" fehlt
Es gibt auch keinen Filter fuer Draft-Profile. Falls ein Nutzer ein Profil begonnen aber nicht abgeschlossen hat, kann der Admin es nicht gezielt finden.

### 4. Ablauf-Logik: Basic-Profile haben kein Ablaufdatum
Im `check-subscription-expiry` Edge Function (Zeile 52-61) werden Basic-Profile anhand von `premium_until` geprueft. Aber bei der Admin-Aktivierung (Zeile 204) wird fuer Basic-Profile `premium_until` gesetzt. Das ist inkonsistent:
- Beim Gratis-Aktivieren (Zeile 427-429): Basic bekommt **kein** `premium_until`
- Beim normalen Aktivieren (Zeile 204-206): Basic bekommt `premium_until`

Das bedeutet: Gratis-Basic-Profile laufen nie ab, bezahlte Basic-Profile schon. Das sollte konsistent sein.

### 5. UserDashboard: Kein Handling fuer `inactive` Status
Das UserDashboard zeigt fuer inaktive Profile keinen speziellen Hinweis an (z.B. "Dein Inserat ist abgelaufen"). Es gibt zwar den "Reaktivieren"-Button im Paket-Bereich, aber kein visuelles Status-Banner wie bei `pending`, `rejected` oder `active`.

### 6. UserDashboard: `payment_status = 'free'` wird nicht erkannt
Profile mit `payment_status = 'free'` zeigen den "Jetzt bezahlen"-Hinweis nicht an (korrekt), aber die Verlaengerungs-Logik (Zeile 476) prueft nur `payment_status === 'paid'`. Gratis-Profile, die aktiv sind, sehen weder den Verlaengerungs-Button noch den Ablauf-Hinweis.

### 7. RotationDebugTool: Falsche Intervall-Angabe
Das `RotationDebugTool` (Zeile 27) berechnet den Key mit `30 * 60 * 1000` (30 Min), aber der tatsaechliche `useRotationKey` Hook (Zeile 8) nutzt `10 * 60 * 1000` (10 Min). Die Anzeige im Debug-Tool stimmt nicht mit der echten Rotation ueberein.

### 8. Profil-Ansicht: Kein `is_premium`-Feld in der DB-Abfrage
In `Profil.tsx` (Zeile 230) wird `profile.is_premium` geprueft fuer das VIP-Badge. Dieses Feld kommt aus der `public_profiles` View -- es muss sichergestellt sein, dass es dort korrekt berechnet wird (z.B. `listing_type IN ('premium', 'top')`).

## Vorgeschlagene Aenderungen

### Schritt 1: Admin-Filter erweitern
In `AdminProfile.tsx` die fehlenden Status-Optionen hinzufuegen:
- `inactive` (Inaktiv/Abgelaufen)
- `draft` (Entwurf)

### Schritt 2: UserDashboard -- Inaktiv-Banner
Einen Status-Banner fuer `inactive` Profile hinzufuegen:
"Dein Inserat ist abgelaufen. Reaktiviere es, um wieder sichtbar zu sein."

### Schritt 3: UserDashboard -- Gratis-Profile korrekt behandeln
Die Bedingung fuer den Verlaengerungs-Button erweitern:
`profile.status === 'active' && (profile.payment_status === 'paid' || profile.payment_status === 'free')`

### Schritt 4: RotationDebugTool korrigieren
Den Rotation-Key-Berechnung von `30 * 60 * 1000` auf `10 * 60 * 1000` aendern, damit es mit dem echten Hook uebereinstimmt.

### Schritt 5: Basic-Ablauf konsistent machen
In der `activateFreeMutation` (AdminProfile.tsx, Zeile 427): Auch fuer Basic mit Duration ein `premium_until` setzen, damit der Ablauf-Check greift.

### Schritt 6: Datenbereinigung
SQL-Query bereitstellen, um die 30 "aktiven Basic mit pending Payment" Profile zu bereinigen -- entweder `payment_status = 'free'` setzen oder `status = 'inactive'`.

## Technische Details

Betroffene Dateien:
- `src/pages/admin/AdminProfile.tsx` -- Filter + Gratis-Logik
- `src/pages/UserDashboard.tsx` -- Inaktiv-Banner + Gratis-Handling
- `src/components/admin/RotationDebugTool.tsx` -- Intervall-Fix
- `supabase/functions/check-subscription-expiry/index.ts` -- Bereits korrekt, aber Daten muessen konsistent sein
- Datenbank: Bereinigung der 30 Testprofile
