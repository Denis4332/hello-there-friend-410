

# Plan: Verbesserte Änderungsanfrage mit bestehenden Daten und Foto-Verwaltung

## Übersicht

Die Änderungsanfrage-Seite wird erweitert, damit:
1. Alle aktuellen Werte sichtbar sind (nicht nur als kleine Hinweistexte)
2. Bestehende Fotos angezeigt und verwaltet werden können
3. Daten zwischen Tab-Wechseln erhalten bleiben (bereits implementiert)

---

## Teil 1: Bessere Anzeige der aktuellen Werte

### Text-Tab Verbesserung

Aktuell wird nur ein kleiner Hinweis "Aktuell: Name" gezeigt. Neu:
- Deutliche Anzeige "Aktueller Name" und "Neuer Name" nebeneinander
- Änderungen werden visuell hervorgehoben (farblich markiert wenn geändert)

### Kontakt-Tab Verbesserung

Aktuell: Nur Eingabefelder ohne Anzeige der aktuellen Werte. Neu:
- Jedes Feld zeigt "Aktuell: +41..." unter dem Input
- Farbliche Markierung wenn der Wert geändert wurde

### Kategorien-Tab Verbesserung

Aktuell: Checkboxen ohne Hinweis was "vorher" war. Neu:
- Badge-Markierung "Aktuell" bei bereits gewählten Kategorien
- Zusammenfassung: "Neu hinzugefügt: X" / "Entfernt: Y"

---

## Teil 2: Fotos-Tab mit bestehenden Bildern

### Neue Funktionen

1. **Bestehende Fotos laden und anzeigen**
   - Alle aktuellen Profilfotos in einer Grid-Ansicht
   - Positionsnummer und "Hauptfoto"-Badge
   
2. **Zum Löschen markieren**
   - Ein-Klick Toggle zum Markieren/Entmarkieren
   - Rote Überblendung bei markierten Fotos
   
3. **Reihenfolge ändern**
   - Pfeil-Buttons zum Verschieben nach links/rechts
   
4. **Neues Hauptfoto setzen**
   - Stern-Button zum Auswählen
   
5. **Neue Fotos hinzufügen**
   - Bestehender Upload bleibt erhalten

### Neue State-Variablen

```text
existingPhotos[]     - Geladene Fotos aus der DB
photosToDelete[]     - IDs der zum Löschen markierten Fotos
newPhotoOrder[]      - Neue Reihenfolge der Foto-IDs
newPrimaryPhotoId    - ID des neuen Hauptfotos (falls geändert)
```

### UI-Struktur des erweiterten Fotos-Tabs

```text
┌─────────────────────────────────────────────────────────────┐
│  FOTOS                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Deine aktuellen Fotos (5)                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐         │
│  │  1    │ │  2    │ │  3    │ │  4    │ │  5    │         │
│  │ [IMG] │ │ [IMG] │ │ [IMG] │ │ [IMG] │ │ [IMG] │         │
│  │ HAUPT │ │  [X]  │ │       │ │  [X]  │ │       │         │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘         │
│                                                             │
│  Markierte Änderungen:                                      │
│  - 2 Fotos zum Löschen markiert                            │
│  - Neue Reihenfolge wird angefragt                          │
│                                                             │
│  ─────────────────────────────────────────────────          │
│                                                             │
│  Neue Fotos hinzufügen                                      │
│  ┌──────────────────────────────────────┐                   │
│  │  [+ Bilder hochladen...]             │                   │
│  └──────────────────────────────────────┘                   │
│                                                             │
│  Anmerkungen: [___________________]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Teil 3: Technische Änderungen

### Datei: `src/pages/ProfileChangeRequest.tsx`

#### Neue Interfaces

```typescript
interface ExistingPhoto {
  id: string;
  storage_path: string;
  url: string;
  is_primary: boolean;
}
```

#### Neue State-Variablen (ca. Zeile 114)

```typescript
// Existing photos management
const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
const [newPhotoOrder, setNewPhotoOrder] = useState<string[]>([]);
const [orderChanged, setOrderChanged] = useState(false);
const [newPrimaryPhotoId, setNewPrimaryPhotoId] = useState<string | null>(null);
```

#### Erweiterte loadData() Funktion

Laden der bestehenden Fotos aus der `photos`-Tabelle:

```typescript
// Load existing photos (nach Kontaktdaten-Laden)
const { data: photosData } = await supabase
  .from('photos')
  .select('id, storage_path, is_primary')
  .eq('profile_id', profileData.id)
  .order('created_at', { ascending: true });

if (photosData) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const mapped = photosData.map(p => ({
    id: p.id,
    storage_path: p.storage_path,
    url: `${supabaseUrl}/storage/v1/object/public/profile-photos/${p.storage_path}`,
    is_primary: p.is_primary,
  }));
  setExistingPhotos(mapped);
  setNewPhotoOrder(mapped.map(p => p.id));
}
```

#### Neue Handler-Funktionen

```typescript
// Foto zum Löschen markieren/entmarkieren
const togglePhotoForDeletion = (photoId: string) => {
  setPhotosToDelete(prev => 
    prev.includes(photoId) 
      ? prev.filter(id => id !== photoId)
      : [...prev, photoId]
  );
};

// Foto nach links verschieben
const movePhotoLeft = (photoId: string) => {
  const index = newPhotoOrder.indexOf(photoId);
  if (index > 0) {
    const newOrder = [...newPhotoOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setNewPhotoOrder(newOrder);
    setOrderChanged(true);
  }
};

// Foto nach rechts verschieben
const movePhotoRight = (photoId: string) => {
  const index = newPhotoOrder.indexOf(photoId);
  if (index < newPhotoOrder.length - 1) {
    const newOrder = [...newPhotoOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setNewPhotoOrder(newOrder);
    setOrderChanged(true);
  }
};

// Neues Hauptfoto setzen
const setNewPrimary = (photoId: string) => {
  if (!photosToDelete.includes(photoId)) {
    setNewPrimaryPhotoId(photoId);
  }
};
```

#### Erweiterte buildDescription() für Fotos

```typescript
case 'photos':
  // Löschungen
  if (photosToDelete.length > 0) {
    changes.push({ 
      field: 'delete_photos', 
      old_value: `${photosToDelete.length} Fotos`, 
      new_value: photosToDelete.map(id => {
        const idx = existingPhotos.findIndex(p => p.id === id);
        return `Foto ${idx + 1}`;
      }).join(', ')
    });
  }
  
  // Neue Reihenfolge
  if (orderChanged) {
    changes.push({ 
      field: 'reorder_photos', 
      old_value: existingPhotos.map((_, i) => i + 1).join(' → '),
      new_value: newPhotoOrder.map(id => {
        const idx = existingPhotos.findIndex(p => p.id === id);
        return idx + 1;
      }).join(' → ')
    });
  }
  
  // Neues Hauptfoto
  if (newPrimaryPhotoId) {
    const currentPrimary = existingPhotos.find(p => p.is_primary);
    if (currentPrimary?.id !== newPrimaryPhotoId) {
      changes.push({ 
        field: 'primary_photo', 
        old_value: `Foto ${existingPhotos.findIndex(p => p.is_primary) + 1}`,
        new_value: `Foto ${existingPhotos.findIndex(p => p.id === newPrimaryPhotoId) + 1}`
      });
    }
  }
  
  // Neue Uploads
  if (selectedFiles.length > 0) {
    changes.push({ field: 'new_photos', old_value: '', new_value: `${selectedFiles.length} neue Bilder` });
  }
  
  // Anmerkung
  if (photoNote.trim()) {
    changes.push({ field: 'photo_note', old_value: '', new_value: photoNote });
  }
  break;
```

#### Erweiterte hasChanges() Prüfung

```typescript
case 'photos':
  return selectedFiles.length > 0 || 
         photoNote.trim() !== '' || 
         photosToDelete.length > 0 || 
         orderChanged ||
         (newPrimaryPhotoId !== null && newPrimaryPhotoId !== existingPhotos.find(p => p.is_primary)?.id);
```

#### Neue Icons importieren

```typescript
import { 
  // ... bestehende
  Trash2, Undo, Star, ChevronLeft, ChevronRight, MoveHorizontal 
} from 'lucide-react';
```

---

## Teil 4: UI-Verbesserungen für andere Tabs

### Text-Tab: Sichtbarer Vergleich

Unter jedem Eingabefeld wird bei Änderung ein Vergleich angezeigt:

```text
Name
[________________]
↳ Aktuell: "Maria Zürich" → Neu: "Maria Bern"
```

### Kontakt-Tab: Aktuelle Werte

Jedes Feld bekommt einen Hinweis wenn es einen aktuellen Wert gibt:

```text
Telefon
[________________]
↳ Aktuell: +41 79 123 45 67
```

### Kategorien-Tab: Änderungsübersicht

Unter den Checkboxen eine Zusammenfassung:

```text
Änderungen:
+ Massage (neu hinzugefügt)
- Escort (entfernt)
```

---

## Zusammenfassung der Änderungen

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| Text | Kleiner Hinweis "Aktuell: X" | Deutlicher Vergleich Alt/Neu |
| Kontakt | Keine aktuellen Werte sichtbar | Aktuelle Werte unter jedem Feld |
| Kategorien | Kein Vergleich | Zusammenfassung + Änderungen |
| Fotos | Nur Upload | Grid mit Löschen/Sortieren/Hauptfoto |

---

## Vorteile

1. **Transparenz**: User sieht immer was aktuell ist und was sich ändert
2. **Kontrolle**: Bestehende Fotos können verwaltet werden
3. **Keine Datenverlust**: Tab-Wechsel behält alle Eingaben (bereits implementiert)
4. **Admin-Effizienz**: Strukturierte Änderungsdaten statt Freitext-Interpretation

