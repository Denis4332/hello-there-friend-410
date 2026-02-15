
# Admin-Dashboard: Ablaufdaten + kleine Fixes

## Status aller bisherigen Fixes

Alle 6 Fixes aus dem vorherigen Plan sind korrekt umgesetzt:
- [x] Admin-Filter: `inactive` und `draft` hinzugefuegt
- [x] UserDashboard: Inaktiv-Banner hinzugefuegt
- [x] UserDashboard: Gratis-Profile korrekt behandelt (`paid || free`)
- [x] RotationDebugTool: Intervall auf 10 Min korrigiert
- [x] Admin Gratis-Aktivierung: Basic bekommt jetzt auch `premium_until`
- [x] Datenbereinigung: 30 Basic-Profile auf `payment_status = 'free'` gesetzt

**Noch offen:** Kommentar in RotationDebugTool Zeile 21 sagt noch "30 minutes" statt "10 minutes" -- kleiner Textfehler

## Neue Aenderungen

### 1. Admin-Profiltabelle: Ablaufdatum-Spalte hinzufuegen

In `AdminProfile.tsx` wird eine neue Spalte **"Ablauf"** zwischen "Erstellt" und "Aktionen" eingefuegt:
- Zeigt `premium_until` oder `top_ad_until` formatiert als Datum (z.B. "04.03.2026")
- Wenn kein Ablaufdatum: Strich "-"
- Farbkodierung:
  - **Rot**: Laeuft in weniger als 3 Tagen ab
  - **Orange**: Laeuft in weniger als 7 Tagen ab  
  - **Gruen**: Mehr als 7 Tage verbleibend
  - **Grau**: Kein Ablaufdatum oder bereits abgelaufen

### 2. Admin-Dashboard: "Bald ablaufend" Kachel

Eine **4. Kachel** im Dashboard hinzufuegen (gelb/amber):
- Titel: "Bald ablaufend"
- Zaehlt Profile mit `status = 'active'` UND Ablaufdatum innerhalb der naechsten 7 Tage
- Klick fuehrt zu `/admin/profile?status=active` (gefiltert)
- Zeigt Anzahl betroffener Profile

### 3. RotationDebugTool: Kommentar-Fix

Zeile 21: `// Current rotation key (changes every 30 minutes)` aendern zu `// Current rotation key (changes every 10 minutes)`

## Technische Details

### Betroffene Dateien:
- `src/pages/admin/AdminProfile.tsx` -- Neue "Ablauf"-Spalte in Profiltabelle (Zeilen 880-955)
- `src/pages/admin/AdminDashboard.tsx` -- Neue Kachel "Bald ablaufend" + Query-Erweiterung
- `src/components/admin/RotationDebugTool.tsx` -- Kommentar-Fix Zeile 21

### Dashboard-Query Erweiterung:
Neue Abfrage fuer bald ablaufende Profile:
```text
profiles WHERE status = 'active' 
  AND (premium_until < now() + 7 days OR top_ad_until < now() + 7 days)
```

### Ablauf-Spalte Logik:
```text
expiryDate = profile.premium_until || profile.top_ad_until
daysLeft = (expiryDate - now) / (1000*60*60*24)

Farbe:
  daysLeft < 0  -> grau (abgelaufen)
  daysLeft < 3  -> rot
  daysLeft < 7  -> orange
  sonst         -> gruen
```
