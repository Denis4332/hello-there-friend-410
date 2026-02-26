

## Fix: Reaktivierung erfordert Admin-Review

### Aenderung (1 Datei, 1 Stelle)

**`supabase/functions/payport-return/index.ts`** — Zeile 180-184:

**Vorher:**
```typescript
const newStatus = (previousStatus === 'active' || previousStatus === 'inactive')
  ? 'active'
  : previousStatus;
```

**Nachher:**
```typescript
const newStatus = previousStatus === 'active'
  ? 'active'
  : 'pending';
```

### Zusammenfassung

- Keine ID-Aenderungen, keine Duplikate, keine neuen Tabellen/Spalten
- Verlaengerung (aktiv → aktiv): unveraendert
- Reaktivierung (inaktiv → pending): Admin muss pruefen bevor es live geht
- Zahlung, Ablaufdaten, Fotos bleiben identisch

