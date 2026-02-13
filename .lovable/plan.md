

## PayPort Edge Functions Fix

### Analyse der aktuellen Probleme

**payport-checkout/index.ts - 2 Probleme gefunden:**

1. **Fehlender `lc` Parameter**: Der Hash-String und die URL enthalten kein `lc` (Language Code). Laut Anforderung muss `lc` alphabetisch zwischen `id` und `ps` stehen: `a, ak, c, cc, id, lc, ps, pt, r, ts`
2. **`ps` wird bedingt hinzugefuegt**: Aktuell wird `ps` nur hinzugefuegt wenn nicht leer. Fuer beide Methoden (SMS/PHONE) ist `ps` aber immer gesetzt, also muss es immer im Hash sein

**payport-return/index.ts - Korrekt:**
- Nutzt bereits `apiBaseUrl + '/getTransactionStatus'` und `'/releaseTransaction'`
- Setzt `payment_status: 'paid'` bei Erfolg
- Keine Aenderungen noetig

### Aenderungen

**Datei: `supabase/functions/payport-checkout/index.ts`**

1. `lc = 'DE'` als festen Wert hinzufuegen (oder optional als Secret)
2. `lc` in das `params` Objekt aufnehmen - wird dann automatisch alphabetisch sortiert
3. `ps` immer ins params Objekt aufnehmen (nicht bedingt) - da bei beiden Methoden ein Wert gesetzt ist
4. Sicherstellen dass `r` (returnUrl) im Hash NICHT encoded wird, aber in der URL schon - aktuell korrekt da `params.r = returnUrl` original bleibt und `URLSearchParams` die Kodierung uebernimmt

**Keine Aenderungen an:**
- `supabase/functions/payport-return/index.ts` (funktioniert bereits korrekt)
- `supabase/config.toml`
- Keine anderen Dateien

### Technische Details

Aktuelle Hash-Reihenfolge (falsch):
```text
a, ak, c, cc, id, ps, pt, r, ts
```

Neue Hash-Reihenfolge (korrekt):
```text
a, ak, c, cc, id, lc, ps, pt, r, ts
```

Der einzige Unterschied ist das Hinzufuegen von `lc=DE` an der alphabetisch korrekten Position.

Beide Edge Functions werden nach der Aenderung neu deployed.

