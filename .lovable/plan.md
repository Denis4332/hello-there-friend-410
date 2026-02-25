

## Plan: Dashboard-Deduplizierung für "Zu prüfen"

### Problem
Das Profil "Test" ist gleichzeitig `status='pending'` UND hat eine `pending` Verifizierung. Der aktuelle Code zählt beides separat und addiert: 1 + 1 = 2. In Wirklichkeit ist es aber nur 1 Profil mit Prüfbedarf.

### Änderung in `src/pages/admin/AdminDashboard.tsx`

**Queries anpassen** (Zeilen 36, 40): Statt `head: true` (nur Anzahl) werden IDs geladen:
- `profiles` pending: `select('id')` statt `select('*', { count: 'exact', head: true })`
- `verification_submissions` pending: `select('profile_id')` statt count

**Deduplizierung** (neue Logik nach den Queries):
```typescript
const pendingProfileIds = (pendingProfilesRes.data || []).map(p => p.id);
const verificationProfileIds = (verificationsRes.data || []).map(v => v.profile_id);
const uniqueProfileIds = new Set([...pendingProfileIds, ...verificationProfileIds]);
```

**Zähler**:
- `toReview.total` = `uniqueProfileIds.size + reportsCount`
- `toReview.profiles` = `uniqueProfileIds.size` (dedupliziert)

**Query-Options** anpassen für frischere Daten:
- `staleTime: 0` und `refetchOnMount: 'always'` für `admin-stats`

### Ergebnis
- Profil "Test" wird als **1** gezählt, nicht 2
- Kein Doppelzählen mehr möglich, egal wie viele pending-Flags ein Profil hat
- Keine DB-Änderung, keine Seiteneffekte

