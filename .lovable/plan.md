
# Fix: Änderungsanfragen-System - "undefined" Anzeige & Foto-Upload

## Zusammenfassung der Probleme

### Problem 1: "undefined: undefined" wird angezeigt
**Ursache**: Die User-Seite (`ProfileChangeRequest.tsx`) verwendet beim Parsen der Anfragen das falsche Schema für das neue kombinierte Format.

**Aktueller Code (Zeile 1585-1597)**:
```typescript
const changes = JSON.parse(request.description);
if (Array.isArray(changes)) {
  return changes.map((c) => `${c.field}: ${c.new_value}`).join(', ');
}
```

**Problem**: Bei kombinierten Anfragen hat jedes Array-Element die Struktur `{type: "text", changes: [...]}` - nicht direkt `{field, new_value}`.

### Problem 2: Foto nach Genehmigung nicht auf Profil sichtbar
**Ursache**: In `AdminChangeRequests.tsx` werden Media-URLs nur für Requests mit `request_type === 'photos'` geladen:
```typescript
requests
  .filter(r => r.request_type === 'photos')  // ← Filtert 'combined' aus!
  .forEach(r => loadMediaForRequest(r.id));
```

Da die Anfrage `request_type: 'combined'` hat, werden die Medien nie geladen, und `applyChangesToProfile()` erhält ein leeres `mediaUrls`-Objekt.

---

## Lösung

### Fix 1: ProfileChangeRequest.tsx - Korrekte Anzeige der Änderungen

**Datei**: `src/pages/ProfileChangeRequest.tsx`  
**Zeilen**: 1585-1597

**Änderung**: Nutze `parseDescription` aus den Utils, um beide Formate korrekt zu handhaben.

```typescript
import { parseDescription } from '@/lib/changeRequestUtils';

// In der Anzeige der existierenden Anfragen:
{(() => {
  const changeGroups = parseDescription(request.description);
  if (changeGroups) {
    // Neues kombiniertes Format
    return changeGroups.flatMap(group => 
      group.changes.map(c => `${c.field}: ${c.new_value}`)
    ).join(', ');
  }
  // Legacy Format oder Plain Text
  try {
    const legacyChanges = JSON.parse(request.description);
    if (Array.isArray(legacyChanges)) {
      return legacyChanges.map((c) => `${c.field}: ${c.new_value}`).join(', ');
    }
  } catch {}
  return request.description;
})()}
```

---

### Fix 2: AdminChangeRequests.tsx - Medien auch für 'combined' Requests laden

**Datei**: `src/pages/admin/AdminChangeRequests.tsx`  
**Zeilen**: 157-163

**Änderung**: Lade Medien für ALLE Requests, die potentiell Fotos enthalten (nicht nur `request_type === 'photos'`).

```typescript
// Alt:
requests
  .filter(r => r.request_type === 'photos')
  .forEach(r => loadMediaForRequest(r.id));

// Neu:
requests
  .filter(r => 
    r.request_type === 'photos' || 
    r.request_type === 'combined' ||
    (r.description && r.description.includes('"new_photos"'))
  )
  .forEach(r => loadMediaForRequest(r.id));
```

---

### Fix 3: AdminChangeRequests.tsx - Media-Vorschau auch für 'combined' anzeigen

**Datei**: `src/pages/admin/AdminChangeRequests.tsx`  
**Zeilen**: 407-442

**Änderung**: Zeige den Media-Bereich nicht nur für `photos`-Requests, sondern auch wenn Medien existieren.

```typescript
// Alt:
{request.request_type === 'photos' && (

// Neu:
{(request.request_type === 'photos' || 
  request.request_type === 'combined' ||
  mediaUrls[request.id]?.length > 0) && (
```

---

## Erwartetes Ergebnis

1. **User-Seite**: Statt `undefined: undefined` wird z.B. angezeigt:
   - `display_name: Testfbbefbbertagbtre, about_me: testbterbrtbrtgbnnbngeertathgbtrea, categories: Damen, MILF...`

2. **Admin-Seite**: 
   - Bilder werden auch bei `combined`-Anfragen geladen und angezeigt
   - Bei Genehmigung werden die Bilder korrekt auf das Profil kopiert

---

## Technische Details

### Betroffene Dateien:
1. `src/pages/ProfileChangeRequest.tsx` - Zeilen 1585-1597
2. `src/pages/admin/AdminChangeRequests.tsx` - Zeilen 157-163 und 407-442

### Kein Datenbankschema-Änderung erforderlich
Die Daten sind korrekt gespeichert - nur die Frontend-Logik muss angepasst werden.

### Risiko: Niedrig
Beide Fixes sind rückwärtskompatibel mit dem Legacy-Format.
