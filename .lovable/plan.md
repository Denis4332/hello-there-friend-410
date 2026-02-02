
# Plan: Änderungsanfrage-System + Admin Dashboard Vereinfachung

## Problemanalyse

### 1. Sicherheitslücke: AGB-Umgehung
Aktuell kann ein User nach Aktivierung (`status = 'active'` + `payment_status = 'paid'`) sein Profil beliebig in `ProfileEdit.tsx` bearbeiten - ohne erneute Prüfung. Das ermöglicht AGB-widrige Inhalte nach der Freischaltung.

### 2. Admin Dashboard zu komplex
7 separate Statistik-Kacheln sind unübersichtlich. Eine kompaktere Darstellung mit 4 fokussierten Kacheln ist gewünscht.

---

## Teil 1: Änderungsanfrage-System

### Datenbank-Migration

Neue Tabelle `profile_change_requests`:

```sql
CREATE TABLE profile_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('text', 'photos', 'contact', 'categories', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON profile_change_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create requests" ON profile_change_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY "Admin full access" ON profile_change_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### Frontend-Änderungen

#### 1. ProfileEdit.tsx - Sicherheitscheck (Zeile ~275)

Redirect aktive Profile zur Änderungsanfrage-Seite:

```typescript
// Nach dem Loading-Check, vor dem Render
if (profile?.status === 'active') {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Profil ist aktiv</CardTitle>
              <CardDescription>
                Dein Profil ist bereits freigeschaltet. Änderungen müssen zur Prüfung eingereicht werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate('/profil/aenderung-anfragen')}>
                Änderung anfragen
              </Button>
              <Button variant="outline" onClick={() => navigate('/mein-profil')}>
                Zurück zum Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
```

#### 2. UserDashboard.tsx - Button-Logik (Zeile ~283)

Unterschiedliche Buttons je nach Profilstatus:

```typescript
{profile.status === 'active' ? (
  <Button asChild variant="outline">
    <Link to="/profil/aenderung-anfragen">
      <Edit className="h-4 w-4 mr-2" />
      Änderung anfragen
    </Link>
  </Button>
) : (
  <Button asChild variant="outline">
    <Link to="/profil/bearbeiten">
      <Edit className="h-4 w-4 mr-2" />
      {editProfileButton || 'Profil bearbeiten'}
    </Link>
  </Button>
)}
```

#### 3. Neue Seite: ProfileChangeRequest.tsx

Formular für Änderungsanfragen mit:
- Dropdown: Art der Änderung (Text, Fotos, Kontakt, Kategorien, Sonstiges)
- Textarea: Beschreibung was geändert werden soll
- Submit speichert in `profile_change_requests`

#### 4. App.tsx - Neue Route

```typescript
<Route path="/profil/aenderung-anfragen" element={<ProfileChangeRequest />} />
```

---

## Teil 2: Admin Dashboard Vereinfachung

### Vorher (7 Kacheln):
- Zu prüfen, Bezahlt (wartet), Verifiziert, Live, Nachrichten, Meldungen, Gesperrte Accounts

### Nachher (4 fokussierte Kacheln):

| Kachel | Inhalt | Farbe |
|--------|--------|-------|
| **Aktionen nötig** | Bezahlt+Pending + Änderungsanfragen + Meldungen | Rot |
| **Zu prüfen** | Pending Profiles + Verifikationen | Orange |
| **Live** | Aktive Profile | Grün |
| **Nachrichten** | Ungelesene Kontaktanfragen | Blau |

### AdminDashboard.tsx - Kompakte Stats

```typescript
const stats = [
  {
    label: 'Aktionen nötig',
    value: (paidPendingCount || 0) + (changeRequestsCount || 0) + (reportsCount || 0),
    subLabel: `${paidPendingCount} bezahlt, ${changeRequestsCount} Anfragen, ${reportsCount} Meldungen`,
    link: '/admin/actions',
    icon: Bell,
    color: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  {
    label: 'Zu prüfen',
    value: (pendingCount || 0) + (pendingVerifications || 0),
    subLabel: `${pendingCount} Profile, ${pendingVerifications} Verifikationen`,
    link: '/admin/profile?status=pending',
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  {
    label: 'Live',
    value: activeCount || 0,
    link: '/admin/profile?status=active',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  },
  {
    label: 'Nachrichten',
    value: unreadMessages || 0,
    link: '/admin/messages',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
];
```

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/ProfileEdit.tsx` | Sicherheitscheck für aktive Profile |
| `src/pages/UserDashboard.tsx` | Button-Logik ändern |
| `src/pages/ProfileChangeRequest.tsx` | **NEU** - Änderungsanfrage-Formular |
| `src/pages/admin/AdminDashboard.tsx` | Kompaktere Stats + Änderungsanfragen-Zähler |
| `src/App.tsx` | Neue Route hinzufügen |
| **Datenbank** | Migration für `profile_change_requests` Tabelle |

---

## Sicherheit

- **Erstellungs-Flow bleibt unberührt**: `ProfileCreate.tsx` funktioniert weiterhin mit State Persistenz und schnellem Upload
- **Nur aktive Profile betroffen**: Draft, Pending, Rejected können weiterhin direkt bearbeitet werden
- **Alle Änderungen werden geloggt**: Neue Tabelle mit vollständiger History
- **Admin-Kontrolle**: Jede Änderung muss genehmigt werden

---

## Ablauf nach Implementierung

```text
[User erstellt Profil] → [Draft] → [Upload Fotos] → [Pending]
                                                        ↓
                                                   [Bezahlung]
                                                        ↓
                                              [Admin aktiviert]
                                                        ↓
                                                   [ACTIVE]
                                                        ↓
                                    ┌───────────────────┴───────────────────┐
                                    ↓                                       ↓
                          User will ändern                          Profil bleibt
                                    ↓
                        [Änderung anfragen]
                                    ↓
                     Admin sieht im Dashboard
                                    ↓
                    [Genehmigt / Abgelehnt]
```
