
# Plan: Änderungsanfragen löschen können

## Übersicht

User sollen eigene Änderungsanfragen löschen können, falls sie einen Fehler gemacht haben. Allerdings nur solange die Anfrage noch **nicht bearbeitet** wurde (Status: `pending`).

---

## Was fehlt aktuell?

1. **Keine DELETE RLS-Policy für User** - Nur Admins können löschen
2. **Kein Lösch-Button in der UI** - Die Anfragenliste zeigt keinen Button

---

## Technische Änderungen

### 1. Datenbank-Migration: DELETE-Policy hinzufügen

```sql
-- User können ihre eigenen PENDING Anfragen löschen
CREATE POLICY "Users can delete own pending requests"
ON public.profile_change_requests
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  AND status = 'pending'
);
```

**Wichtig:** Nur `pending` Anfragen können gelöscht werden - sobald Admin sie bearbeitet hat (approved/rejected), bleibt sie als Nachweis erhalten.

### 2. ProfileChangeRequest.tsx: Lösch-Funktion + Button

**Neue Funktion:**
```typescript
const handleDeleteRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('profile_change_requests')
    .delete()
    .eq('id', requestId);

  if (error) {
    toast({
      title: 'Fehler',
      description: 'Anfrage konnte nicht gelöscht werden.',
      variant: 'destructive',
    });
    return;
  }

  toast({
    title: 'Anfrage gelöscht',
    description: 'Die Änderungsanfrage wurde entfernt.',
  });

  // Auch zugehörige Medien aus Storage löschen
  // loadData() neu laden
};
```

**UI-Erweiterung (im Anfragen-Bereich):**
```text
┌─────────────────────────────────────────────────────────────┐
│  Texte                                          [Ausstehend]│
│  Name: "Alt" → "Neu"                                        │
│  02.02.2026, 14:30                                          │
│                                                             │
│  [🗑️ Löschen]  ← Nur bei status === 'pending'              │
└─────────────────────────────────────────────────────────────┘
```

Bei genehmigten/abgelehnten Anfragen wird kein Lösch-Button angezeigt.

### 3. Bestätigungsdialog vor dem Löschen

Mit AlertDialog fragen, ob wirklich gelöscht werden soll:
- "Möchtest du diese Anfrage wirklich löschen?"
- [Abbrechen] [Löschen]

### 4. Zugehörige Medien löschen

Falls Fotos hochgeladen wurden (`change_request_media`), müssen diese auch gelöscht werden:
```typescript
// Vor dem Löschen der Anfrage: Medien abrufen und aus Storage entfernen
const { data: media } = await supabase
  .from('change_request_media')
  .select('storage_path')
  .eq('request_id', requestId);

if (media?.length) {
  await supabase.storage
    .from('change-request-media')
    .remove(media.map(m => m.storage_path));
}
```

---

## Zusammenfassung der Änderungen

| Datei/Bereich | Änderung |
|---------------|----------|
| **Datenbank-Migration** | DELETE-Policy für `pending` Anfragen |
| **ProfileChangeRequest.tsx** | `handleDeleteRequest()` Funktion |
| **ProfileChangeRequest.tsx** | Lösch-Button mit AlertDialog |
| **ProfileChangeRequest.tsx** | Medien-Cleanup bei Löschung |

---

## Sicherheit

- User kann **nur eigene** Anfragen löschen (`user_id = auth.uid()`)
- Nur **pending** Anfragen können gelöscht werden
- Bearbeitete Anfragen (approved/rejected) bleiben als Nachweis
- Zugehörige Medien werden aus Storage entfernt
