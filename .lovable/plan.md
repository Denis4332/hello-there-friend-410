

# Plan: Alle Änderungen gemeinsam senden

## Identifiziertes Problem

Aktuell sendet das System **nur den aktiven Tab** als Änderungsanfrage:
- Du änderst Text → Tab wechseln → Standort ändern → "Senden"
- **Nur Standort wird gesendet**, Text-Änderungen gehen verloren!

Das liegt daran, dass in Zeile 647 nur `request_type: activeTab` verwendet wird.

---

## Lösung: Alle Änderungen zusammenfassen

### Neue Logik

Statt pro Tab eine Anfrage zu senden, sammeln wir **alle Änderungen** in einer einzigen Anfrage:

```text
Vorher:
- Tab wählen → Ändern → Senden → 1 Anfrage nur für diesen Tab

Nachher:
- Beliebige Tabs ändern → Senden → 1 Anfrage mit ALLEN Änderungen
```

---

## Technische Änderungen

### 1. Neue `buildAllChanges()` Funktion

Statt `buildDescription()` die nur den aktiven Tab prüft, eine neue Funktion die ALLE Tabs prüft:

```typescript
const buildAllChanges = () => {
  const allChanges: { 
    type: string; 
    changes: { field: string; old_value: string; new_value: string }[] 
  }[] = [];

  // Text-Änderungen prüfen
  const textChanges = [];
  if (newName !== profile?.display_name) {
    textChanges.push({ field: 'display_name', old_value: profile?.display_name || '', new_value: newName });
  }
  if (newAboutMe !== (profile?.about_me || '')) {
    textChanges.push({ field: 'about_me', old_value: profile?.about_me || '', new_value: newAboutMe });
  }
  if (textNote) {
    textChanges.push({ field: 'note', old_value: '', new_value: textNote });
  }
  if (textChanges.length > 0) {
    allChanges.push({ type: 'text', changes: textChanges });
  }

  // Standort-Änderungen prüfen
  const locationChanges = [];
  if (selectedCanton !== profile?.canton) {
    locationChanges.push({ field: 'canton', old_value: profile?.canton || '', new_value: selectedCanton });
  }
  if (selectedCity !== profile?.city) {
    locationChanges.push({ field: 'city', old_value: profile?.city || '', new_value: selectedCity });
  }
  // ... postal_code, coordinates
  if (locationChanges.length > 0) {
    allChanges.push({ type: 'location', changes: locationChanges });
  }

  // Kategorien-Änderungen prüfen
  // ... analog

  // Kontakt-Änderungen prüfen
  // ... analog

  // Foto-Änderungen prüfen
  // ... analog

  return allChanges;
};
```

### 2. `handleSubmit()` anpassen

Zwei Optionen für die Datenbank-Speicherung:

**Option A: Eine Anfrage mit kombiniertem Typ**
```typescript
const allChanges = buildAllChanges();
const requestTypes = allChanges.map(c => c.type).join('+'); // z.B. "text+location"

const { data: request } = await supabase
  .from('profile_change_requests')
  .insert({
    profile_id: profile.id,
    user_id: user.id,
    request_type: requestTypes, // "text+location+photos"
    description: JSON.stringify(allChanges),
    status: 'pending',
  })
  .select()
  .single();
```

**Option B: Mehrere Anfragen (eine pro Typ)** - Einfacher für Admin-Verwaltung
```typescript
const allChanges = buildAllChanges();

for (const changeGroup of allChanges) {
  await supabase
    .from('profile_change_requests')
    .insert({
      profile_id: profile.id,
      user_id: user.id,
      request_type: changeGroup.type,
      description: JSON.stringify(changeGroup.changes),
      status: 'pending',
    });
}
```

**Empfehlung: Option A** - Eine Anfrage mit allen Änderungen ist übersichtlicher für Admin und User.

### 3. Datenbank-Constraint anpassen

Der `request_type` CHECK-Constraint muss kombinierte Typen erlauben oder wir nutzen `'combined'` als Typ:

```sql
-- Option: Neuen Typ 'combined' hinzufügen
ALTER TABLE public.profile_change_requests 
DROP CONSTRAINT profile_change_requests_request_type_check;

ALTER TABLE public.profile_change_requests 
ADD CONSTRAINT profile_change_requests_request_type_check 
CHECK (request_type = ANY (ARRAY[
  'text', 'photos', 'contact', 'categories', 'location', 'other', 'combined'
]));
```

### 4. `hasChanges()` anpassen - Alle Tabs prüfen

```typescript
const hasAnyChanges = () => {
  // Text
  const textChanged = newName !== profile?.display_name || 
                      newAboutMe !== (profile?.about_me || '') || 
                      textNote.trim() !== '';
  
  // Location
  const locationChanged = selectedCanton !== profile?.canton || 
                          selectedCity !== profile?.city;
  
  // Categories
  const categoriesChanged = JSON.stringify([...selectedCategories].sort()) !== 
                            JSON.stringify([...currentCategories].sort());
  
  // Contact
  const contactChanged = contactPhone !== (currentContacts?.phone || '') ||
                         contactWhatsapp !== (currentContacts?.whatsapp || '') ||
                         // ... etc.
  
  // Photos
  const photosChanged = selectedFiles.length > 0 || 
                        photosToDelete.length > 0 || 
                        orderChanged ||
                        // ... etc.

  return textChanged || locationChanged || categoriesChanged || contactChanged || photosChanged;
};
```

### 5. UI: Änderungsübersicht vor dem Senden

Vor dem Absenden eine Zusammenfassung aller Änderungen anzeigen:

```text
┌─────────────────────────────────────────────────────────────┐
│  Deine Änderungen                                           │
│  ─────────────────                                          │
│                                                             │
│  ✓ Text (2 Änderungen)                                      │
│    • Name: "Alt" → "Neu"                                    │
│    • Über mich geändert                                     │
│                                                             │
│  ✓ Standort (1 Änderung)                                    │
│    • Stadt: "Zürich" → "Bern"                               │
│                                                             │
│  ✗ Kategorien (keine Änderung)                              │
│  ✗ Kontakt (keine Änderung)                                 │
│  ✗ Fotos (keine Änderung)                                   │
│                                                             │
│  [Alle Änderungen anfragen]                                 │
└─────────────────────────────────────────────────────────────┘
```

### 6. Admin-Ansicht anpassen

In `AdminChangeRequests.tsx` muss die Anzeige für kombinierte Anfragen funktionieren:
- Bei `request_type === 'combined'`: Alle Änderungsgruppen anzeigen
- Strukturierte Anzeige nach Typ gruppiert

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `ProfileChangeRequest.tsx` | `buildAllChanges()`, `hasAnyChanges()`, kombinierte Anfrage |
| Datenbank-Migration | `request_type` um 'combined' erweitern |
| `AdminChangeRequests.tsx` | Kombinierte Anfragen anzeigen |

---

## Vorteile

1. **Keine verlorenen Änderungen**: Alles wird zusammen gesendet
2. **Übersichtlich**: User sieht alle Änderungen vor dem Senden
3. **Weniger Anfragen**: Admin hat eine Anfrage pro Bearbeitung statt viele
4. **Klar strukturiert**: JSON enthält alle Änderungen nach Typ gruppiert

