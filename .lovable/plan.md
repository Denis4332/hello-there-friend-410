
# Finaler Plan: Änderungsanfragen-System komplett fixen

## Zusammenfassung der Anforderungen

1. **Genehmigen muss zuverlässig funktionieren** - alle ausgewählten Änderungen (Kategorien, Fotos, Text) werden tatsächlich auf das Profil übernommen
2. **Profile ohne Kategorie können nicht erstellt werden** - das ist bereits via Trigger abgesichert
3. **Einfache Differenzierung:**
   - **Nicht aktiv (draft/pending/rejected):** Direkte Änderungen möglich
   - **Aktiv:** Änderungen NUR über das Änderungsanfrage-Formular
4. **payment_status bleibt bestehen** - wird nur nicht für die Bearbeitungs-Differenzierung genutzt

---

## Fix 1: Foto-IDs korrekt speichern (KRITISCH)

**Datei:** `src/pages/ProfileChangeRequest.tsx` (Zeile 537-561)

**Problem:** Aktuell werden Foto-Referenzen als menschenlesbare Strings gespeichert ("Foto 1", "Foto 2"), aber `changeRequestUtils.ts` erwartet echte UUIDs.

**Änderungen:**

| Feld | Aktuell (falsch) | Neu (richtig) |
|------|------------------|---------------|
| `delete_photos` | `"Foto 1, Foto 2"` | `"uuid1,uuid2"` (echte UUIDs) |
| `primary_photo` | `"Foto 3"` | `"photo-uuid"` (echte UUID) |
| `reorder_photos` | `"1 → 3 → 2"` | `"uuid1,uuid3,uuid2"` (UUIDs in neuer Reihenfolge) |

**Code-Änderung (Zeile 537-561):**
```typescript
// DELETE PHOTOS - echte UUIDs speichern
if (photosToDelete.length > 0) {
  photoChanges.push({ 
    field: 'delete_photos', 
    old_value: `${photosToDelete.length} Fotos`, 
    new_value: photosToDelete.join(',')  // ← Echte UUIDs statt "Foto 1, Foto 2"
  });
}

// REORDER PHOTOS - UUIDs in neuer Reihenfolge speichern
if (orderChanged) {
  const oldOrderUUIDs = existingPhotos.map(p => p.id).join(',');
  photoChanges.push({ 
    field: 'reorder_photos', 
    old_value: oldOrderUUIDs, 
    new_value: newPhotoOrder.join(',')  // ← UUIDs statt "1 → 3 → 2"
  });
}

// PRIMARY PHOTO - echte UUID speichern
if (newPrimaryPhotoId) {
  const currentPrimary = existingPhotos.find(p => p.is_primary);
  if (currentPrimary?.id !== newPrimaryPhotoId) {
    photoChanges.push({ 
      field: 'primary_photo', 
      old_value: currentPrimary?.id || '', 
      new_value: newPrimaryPhotoId  // ← UUID statt "Foto 3"
    });
  }
}
```

---

## Fix 2: UUID-Löschlogik robust machen (WICHTIG)

**Datei:** `src/lib/changeRequestUtils.ts` (Zeile 187-197)

**Problem:** Die aktuelle `.not('category_id', 'in', ...)` Syntax kann bei UUIDs Probleme verursachen.

**Aktuelle Logik (problematisch):**
```typescript
.not('category_id', 'in', `(${resolvedCategoryIds.join(',')})`)
```

**Neue robuste Logik:**
```typescript
// Hole zuerst alle existierenden Kategorien
const { data: existing } = await supabase
  .from('profile_categories')
  .select('category_id')
  .eq('profile_id', request.profile_id);

// Lösche nur die, die nicht mehr in der neuen Liste sind
const toDelete = existing
  ?.filter(e => !resolvedCategoryIds.includes(e.category_id))
  .map(e => e.category_id) || [];

for (const catId of toDelete) {
  await supabase
    .from('profile_categories')
    .delete()
    .eq('profile_id', request.profile_id)
    .eq('category_id', catId);
}
```

---

## Fix 3: Foto-Reihenfolge verarbeiten (FEHLT KOMPLETT)

**Datei:** `src/lib/changeRequestUtils.ts` → `processPhotoChanges()`

**Problem:** Das Feld `reorder_photos` wird aktuell gar nicht verarbeitet - es gibt keinen Case dafür.

**Hinzufügen in `processPhotoChanges()` (ca. Zeile 264):**
```typescript
// Reorder photos - update sort_order based on new UUID order
if (change.field === 'reorder_photos' && change.new_value) {
  const newOrder = change.new_value.split(',').filter(Boolean);
  for (let i = 0; i < newOrder.length; i++) {
    await supabase
      .from('photos')
      .update({ sort_order: i })
      .eq('id', newOrder[i])
      .eq('profile_id', request.profile_id);
  }
}
```

**Hinweis:** Falls `photos.sort_order` nicht existiert, muss eine Migration erstellt werden, um dieses Feld hinzuzufügen.

---

## Fix 4: Datenbank-Migration - Trigger korrigieren (WICHTIG)

**Neue Migration:** `supabase/migrations/XXXXXX_fix_category_update_trigger.sql`

**Problem:** Der Trigger `ensure_profile_has_category_update` prüft bei **jedem** Update eines aktiven Profils, ob Kategorien vorhanden sind - nicht nur beim Aktivieren.

**Aktuelle Trigger-Bedingung:**
```sql
WHEN (NEW.status = 'active')  -- Feuert bei JEDEM Update!
```

**Neue Trigger-Bedingung:**
```sql
WHEN (NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active')
-- Feuert NUR beim Wechsel AUF active
```

**Vollständige Migration:**
```sql
-- Fix: Trigger soll nur beim AKTIVIEREN prüfen, nicht bei jedem Update
DROP TRIGGER IF EXISTS ensure_profile_has_category_update ON profiles;

CREATE TRIGGER ensure_profile_has_category_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active')
  EXECUTE FUNCTION check_profile_has_category();
```

---

## Fix 5: Einmalige Datenreparatur für inkonsistentes Profil

**In derselben Migration:**

**Problem:** Das Profil `06a895a5-9241-44f1-bbd2-efccdeee414d` ist `status = 'active'` aber hat **0 Kategorien**.

**SQL:**
```sql
-- Repariere das inkonsistente Profil (aktiv aber ohne Kategorien)
INSERT INTO profile_categories (profile_id, category_id)
SELECT 
  '06a895a5-9241-44f1-bbd2-efccdeee414d', 
  id 
FROM categories 
WHERE name = 'Damen'
ON CONFLICT DO NOTHING;
```

---

## Fix 6: Admin-Warnung bei Aktivierung ohne Kategorien (NICE-TO-HAVE)

**Datei:** `src/pages/admin/AdminProfile.tsx`

**Wo:** Im Status-Dialog, wenn Admin auf "Aktivieren" (status = 'active') klicken will

**Hinzufügen:**
```typescript
{/* Warnung wenn Profil keine Kategorien hat */}
{dialogStatus === 'active' && selectedProfile?.profile_categories?.length === 0 && (
  <div className="bg-destructive/10 border border-destructive/50 rounded p-3 text-sm mb-4">
    ⚠️ <strong>Achtung:</strong> Dieses Profil hat keine Kategorien zugewiesen. 
    Es kann nicht aktiviert werden, bis mindestens eine Kategorie gesetzt ist.
  </div>
)}
```

---

## Zusammenfassung: Dateien die geändert werden

| Datei | Änderung | Priorität |
|-------|----------|-----------|
| `src/pages/ProfileChangeRequest.tsx` | Foto-IDs als echte UUIDs speichern | KRITISCH |
| `src/lib/changeRequestUtils.ts` | UUID-Löschlogik robust + reorder_photos verarbeiten | KRITISCH |
| `supabase/migrations/...sql` | Trigger nur bei Statuswechsel + Datenreparatur | WICHTIG |
| `src/pages/admin/AdminProfile.tsx` | Warnung bei Aktivierung ohne Kategorien | NICE-TO-HAVE |

---

## Was NICHT geändert wird

- **`payment_status` bleibt bestehen** - wird weiterhin für Zahlungs-Tracking verwendet
- **Bearbeitungs-Differenzierung basiert nur auf `status`** - wie gewünscht
- **UserDashboard.tsx** - keine Änderung nötig, da die bestehende Logik bereits korrekt nach `status === 'active'` differenziert (Zeile 368-394, 446-454)
- **ProfileEdit.tsx** - keine Änderung nötig, prüft bereits `status === 'active'`

---

## Erwartetes Ergebnis nach diesem Fix

1. **Genehmigen funktioniert zuverlässig** für alle Änderungstypen (Text, Kategorien, Fotos)
2. **Foto-Löschungen, -Reihenfolge und Hauptfoto** werden korrekt übernommen
3. **Kategorien** werden korrekt übernommen (auch wenn als Namen gespeichert)
4. **Normale Text-/Adress-Updates** an aktiven Profilen werden nicht mehr durch den Trigger blockiert
5. **Nicht aktive Profile:** Direkte Bearbeitung weiterhin möglich
6. **Aktive Profile:** Nur über Änderungsanfrage bearbeitbar
7. **Admin sieht klare Warnung** wenn er ein Profil ohne Kategorien aktivieren will
