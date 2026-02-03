
# Vereinfachung: Änderungsanfrage-System entfernen

## Das Ziel
Statt dem komplexen "Change Request" System soll es ganz einfach funktionieren:

1. **Nicht bezahlt/freigeschaltet**: Direkt bearbeiten → Profil bleibt/geht auf `pending`
2. **Bezahlt & aktiv**: Direkt bearbeiten mit Warnung → Profil geht auf `pending` zur erneuten Prüfung

## Vorteile der Vereinfachung
- Keine separate Änderungsanfrage-Seite mehr
- Kein Admin-Review für Änderungen separat
- Nutzer kann einfach Schritt zurück / bearbeiten
- Admin prüft wie bei neuen Profilen

---

## Was entfernt wird

### 1. Frontend-Dateien löschen
- `src/pages/ProfileChangeRequest.tsx` (1665 Zeilen) - Komplett löschen
- `src/pages/admin/AdminChangeRequests.tsx` - Komplett löschen

### 2. Routing entfernen (App.tsx)
- Route `/profil/aenderung-anfragen` entfernen
- Route `/admin/change-requests` entfernen
- Lazy import `ProfileChangeRequest` entfernen

### 3. Utils entfernen
- `src/lib/changeRequestUtils.ts` - Komplett löschen

### 4. Links/Buttons entfernen
**UserDashboard.tsx (Zeile 375-382)**:
```tsx
// ENTFERNEN:
<Button onClick={() => navigate('/profil/aenderung-anfragen')}>
  Änderung anfragen
</Button>
```
Stattdessen:
```tsx
<Button onClick={() => navigate('/profil/bearbeiten')}>
  Profil bearbeiten
</Button>
```

**AdminDashboard.tsx**:
- Links zu `/admin/change-requests` entfernen

---

## Was geändert wird

### ProfileEdit.tsx - Hauptänderung

**Aktuell (Zeile 279-306)**: Blockiert Bearbeitung für aktive Profile
```tsx
if (profile.status === 'active') {
  return (
    <Card>
      <CardTitle>Profil ist aktiv</CardTitle>
      <Button onClick={() => navigate('/profil/aenderung-anfragen')}>
        Änderung anfragen
      </Button>
    </Card>
  );
}
```

**Neu**: Warnung anzeigen + Bearbeitung erlauben + Status auf `pending` setzen

```tsx
// Warnung für aktive Profile (statt Block)
const [showEditWarning, setShowEditWarning] = useState(false);
const isActiveProfile = profile?.status === 'active';

// Bei Submit: Status auf 'pending' setzen wenn Profil aktiv war
const handleFormSubmit = async (data: ProfileFormData) => {
  const updateData = {
    ...data,
    // Wenn aktiv → pending, sonst Status behalten
    status: isActiveProfile ? 'pending' : profile.status,
    updated_at: new Date().toISOString()
  };
  // ... rest of update logic
};
```

**Warnung-Dialog für aktive Profile**:
```tsx
<AlertDialog open={showEditWarning}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>⚠️ Achtung: Profil ist aktiv</AlertDialogTitle>
      <AlertDialogDescription>
        Wenn du dein Profil jetzt bearbeitest, muss es erneut geprüft werden. 
        Das dauert bis zu 24 Stunden und dein Profil ist in dieser Zeit 
        nicht sichtbar.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => navigate('/mein-profil')}>
        Abbrechen
      </AlertDialogCancel>
      <AlertDialogAction onClick={() => setShowEditWarning(false)}>
        Verstanden, trotzdem bearbeiten
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Datenbank-Aufräumen (Optional)

Die Tabellen können später entfernt werden:
- `profile_change_requests`
- `change_request_media`
- Storage Bucket `change-request-media`

Empfehlung: Vorerst behalten falls alte Daten benötigt werden.

---

## Zusammenfassung der Änderungen

| Datei | Aktion |
|-------|--------|
| `src/pages/ProfileChangeRequest.tsx` | Löschen |
| `src/pages/admin/AdminChangeRequests.tsx` | Löschen |
| `src/lib/changeRequestUtils.ts` | Löschen |
| `src/App.tsx` | Routes + Imports entfernen |
| `src/pages/ProfileEdit.tsx` | Erlauben + Warnung + Status-Update |
| `src/pages/UserDashboard.tsx` | Button ändern |
| `src/pages/admin/AdminDashboard.tsx` | Link entfernen |

---

## Technische Details

### Logik-Flow nach Änderung:

```text
Nutzer klickt "Profil bearbeiten"
         │
         ▼
    Ist Profil aktiv?
         │
    ┌────┴────┐
    │ JA      │ NEIN
    ▼         ▼
Warnung     Direkt
anzeigen    bearbeiten
    │
    ▼
"Verstanden"
    │
    ▼
Bearbeitung möglich
    │
    ▼
Speichern → status = 'pending'
    │
    ▼
Admin prüft wie normales Profil
    │
    ▼
Genehmigt → status = 'active'
```

### Betroffene Status-Übergänge:
- `active` → nach Bearbeitung → `pending`
- `pending` → nach Bearbeitung → `pending` (bleibt)
- `draft` → nach Bearbeitung → `draft` (bleibt, bis Foto hochgeladen)
- `rejected` → nach Bearbeitung → `pending`

