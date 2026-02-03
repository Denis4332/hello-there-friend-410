

# Dashboard Fix: 3 gleich grosse Kacheln

## Problem
- 4 Kacheln statt gewünschte 3
- Kacheln unterschiedlich hoch (manche mit Subtext, manche ohne)

## Lösung

### 1. "Aktionen nötig" Kachel entfernen
- Komplett löschen (Zeile 84-99)
- Query für `paidPendingRes` entfernen (Zeile 27, 34)
- `actionsNeeded` aus Return entfernen

### 2. Meldungen in "Zu prüfen" integrieren
```typescript
toReview: {
  total: pendingCount + pendingVerifications + reportsCount,
  profiles: pendingCount,
  verifications: pendingVerifications,
  reports: reportsCount  // NEU
}
```

### 3. Grid anpassen
- `lg:grid-cols-4` → `lg:grid-cols-3`
- Skeleton von 4 auf 3

### 4. Kacheln gleich hoch machen
Alle 3 Kacheln bekommen gleiche Struktur mit `min-h-[140px]`:

**Zu prüfen** (Orange):
- X Profile
- X Verifikationen
- X Meldungen

**Live** (Grün):
- Aktive Profile
- (Leerzeile für gleiche Höhe)

**Nachrichten** (Blau):
- Ungelesene Nachrichten
- (Leerzeile für gleiche Höhe)

### 5. Imports aufräumen
- `Bell` Icon entfernen (nicht mehr gebraucht)

---

## Ergebnis

| Vorher | Nachher |
|--------|---------|
| 4 Kacheln | 3 Kacheln |
| Unterschiedliche Höhen | Gleiche Höhe (`min-h-[140px]`) |
| Aktionen nötig, Zu prüfen, Live, Nachrichten | Zu prüfen, Live, Nachrichten |

