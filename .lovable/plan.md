
## Problem-Analyse: PayPort Checkout-Seite ist leer

### Diagnose
Die Edge Function `payport-checkout` funktioniert korrekt laut Logs:
- Redirect-URL wird generiert
- Profil wird mit `payment_reference` verknüpft
- ABER: PayPort zeigt leere Seite

### Mögliche Ursachen

1. **Test-Umgebung Problem (wahrscheinlichste Ursache)**
   - `PAYPORT_CC = "TE"` (Testmodus aktiv)
   - PayPort Test-Server kann instabil sein oder leere Seiten zeigen

2. **Payment Source Kombination**
   - SMS + `ps: "VERIFICATION"` funktioniert möglicherweise nicht im Testmodus
   - PHONE + `ps: "TARIFF-CHANGE"` könnte ebenfalls problematisch sein

3. **Hash-Problem**
   - Unwahrscheinlich, da die Logik bereits funktionierte

### Lösungs-Optionen

**Option A: Live-Modus aktivieren (falls bereit)**
- `PAYPORT_CC` von `"TE"` auf `"CH"` ändern
- `PAYPORT_CHECKOUT_URL` auf Live-URL ändern: `https://pip3.payport.ch/prepare/checkout`
- `PAYPORT_API_BASE_URL` auf Live-URL ändern: `https://pip3api.payport.ch/api`

**Option B: Debug-Logging hinzufügen**
- Die generierte Redirect-URL in der Konsole loggen
- URL manuell testen um zu sehen was PayPort zurückgibt

**Option C: Payment Source anpassen**
- `ps` Parameter für SMS auf einen anderen Wert setzen (z.B. `VOUCHER`)
- Oder `ps` komplett weglassen wenn nicht zwingend nötig

### Empfohlener nächster Schritt

1. Teste den Checkout mit `?debug=1` Parameter
2. Kopiere die generierte PayPort-URL aus der Konsole
3. Öffne sie manuell um zu sehen ob PayPort einen Fehler zeigt

Falls Live-Modus gewünscht: Secrets aktualisieren und Edge Function neu deployen.

### Technische Details

**Aktuelle Secret-Konfiguration:**
```text
PAYPORT_CC = "TE" (Testmodus)
PAYPORT_CHECKOUT_URL = https://test-pip3.payport.ch/prepare/checkout
PAYPORT_API_BASE_URL = https://test-pip3api.payport.ch/api
```

**Für Live-Modus benötigt:**
```text
PAYPORT_CC = "CH"
PAYPORT_CHECKOUT_URL = https://pip3.payport.ch/prepare/checkout
PAYPORT_API_BASE_URL = https://pip3api.payport.ch/api
```
