
# Testdaten loeschen + Ablauf-Regeln absichern

## Was wird gemacht

### 1. Testprofile loeschen (Datenbereinigung)

Alle 38 Profile mit `payment_status = 'free'` und ohne Ablaufdatum werden geloescht:
- 30x "BasicTest 1-30" (Basic, kein `premium_until`)
- 4x "Test 1/3/5/7" (Top, haben `top_ad_until` aber kein `premium_until` -- diese haben ein Ablaufdatum und sind ok, werden NICHT geloescht)
- Weitere BasicTest-Profile ohne Ablaufdatum

**Konkret geloescht**: Alle Profile wo `display_name LIKE 'BasicTest%'` OR `display_name LIKE 'Test %'` mit `payment_status = 'free'`.

Da die "Test 1/3/5/7" Top-Profile ein `top_ad_until` haben und korrekt funktionieren, werden NUR die BasicTest-Profile ohne jegliches Ablaufdatum geloescht (ca. 34 Stueck).

### 2. Datenbank-Sicherung: Trigger gegen Profile ohne Ablaufdatum

Ein Datenbank-Trigger wird erstellt, der verhindert, dass ein Profil auf `status = 'active'` gesetzt werden kann OHNE ein gueltiges Ablaufdatum (`premium_until` oder `top_ad_until`). Das stellt sicher, dass **nie wieder** ein aktives Profil ohne Ablauf existieren kann.

Ausnahme: Profile mit `payment_status = 'free'` UND einem gesetzten Ablaufdatum sind erlaubt (Admin-Gratis-Aktivierung setzt ja jetzt korrekt ein Datum).

### 3. Bestaetigung bestehender Code-Logik

Alle Aktivierungspfade setzen bereits korrekt ein Ablaufdatum:
- Admin normale Aktivierung (Zeile 199-210): Setzt 30 Tage automatisch
- Admin Gratis-Aktivierung (Zeile 416-427): Setzt Ablauf basierend auf `durationDays`
- Zahlungsflow: `premium_until` wird bei Profilerstellung/Admin-Aktivierung gesetzt, nicht bei Zahlung

Es muss kein Code geaendert werden -- nur Daten bereinigen und Trigger hinzufuegen.

## Technische Details

### SQL: Testprofile loeschen
```text
DELETE FROM profiles 
WHERE payment_status = 'free' 
  AND premium_until IS NULL 
  AND top_ad_until IS NULL 
  AND status = 'active'
```

### SQL: Sicherheits-Trigger
```text
CREATE FUNCTION validate_active_profile_expiry()
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN NEW.status = 'active' 
    AND NEW.premium_until IS NULL 
    AND NEW.top_ad_until IS NULL
  -> RAISE EXCEPTION 'Active profiles must have an expiry date'
```

### Betroffene Dateien
- Keine Code-Aenderungen noetig
- 1 Datenbank-Migration (Trigger + Cleanup)
