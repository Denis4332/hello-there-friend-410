
# Erweiterter Plan: Änderungen anwenden + Payment-Status-Bug beheben

## Zusammenfassung der Probleme

### Problem 1: Payment-Status-Inkonsistenz
**Symptom:** Profil ist aktiv (status = 'active'), aber zeigt "nicht bezahlt" (payment_status = 'pending')

**Ursache:** In `AdminProfile.tsx` setzt `updateProfileMutation` bei Aktivierung:
- `status: 'active'` 
- `listing_type`, `premium_until`, etc.
- **ABER NICHT** `payment_status: 'paid'`

Wenn Admin ein Profil manuell aktiviert, wird `payment_status` nicht auf `'paid'` gesetzt. Das Profil erscheint dann im Dashboard als "nicht bezahlt".

### Problem 2: Änderungsanfragen werden nicht angewandt
Der "Genehmigen"-Button setzt nur `status: 'approved'`, wendet aber die Änderungen nicht auf die Profil-Tabellen an.

---

## Technische Lösung

### 1. AdminProfile.tsx: Payment-Status bei Aktivierung setzen

In der `updateProfileMutation` muss bei `status === 'active'` auch `payment_status` gesetzt werden:

```typescript
// Bei Aktivierung: payment_status auf 'paid' setzen (falls nicht bereits 'free')
if (data.status === 'active') {
  // Hole aktuellen payment_status
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', data.profileId)
    .single();
    
  // Wenn nicht bereits 'free', auf 'paid' setzen
  if (currentProfile?.payment_status !== 'free') {
    updates.payment_status = 'paid';
  }
}
```

**Logik:**
- `active` + `payment_status = 'pending'` ergibt keinen Sinn
- Bei manueller Aktivierung durch Admin impliziert das bezahlt/freigegeben
- Ausnahme: `payment_status = 'free'` bleibt bestehen (Gratis-Profil)

### 2. AdminChangeRequests.tsx: Änderungen tatsächlich anwenden

Neue Funktion `applyChangesToProfile()` die bei Genehmigung aufgerufen wird:

```typescript
const applyChangesToProfile = async (request: ChangeRequest) => {
  const changeGroups = parseDescription(request.description);
  if (!changeGroups) return;

  const profileUpdates: Record<string, any> = {};
  const contactUpdates: Record<string, any> = {};
  let categoryIds: string[] | null = null;

  for (const group of changeGroups) {
    for (const change of group.changes) {
      switch (change.field) {
        // Profil-Felder
        case 'display_name':
        case 'about_me':
        case 'city':
        case 'canton':
        case 'postal_code':
          profileUpdates[change.field] = change.new_value;
          break;
        case 'coordinates':
          const [lat, lng] = change.new_value.split(',');
          profileUpdates.lat = parseFloat(lat);
          profileUpdates.lng = parseFloat(lng);
          break;
        // Kontakt-Felder  
        case 'phone':
        case 'whatsapp':
        case 'email':
        case 'website':
        case 'telegram':
        case 'instagram':
          contactUpdates[change.field] = change.new_value || null;
          break;
        // Kategorien
        case 'categories':
          categoryIds = change.new_value.split(',').filter(Boolean);
          break;
      }
    }
  }

  // 1. Profile-Tabelle aktualisieren
  if (Object.keys(profileUpdates).length > 0) {
    profileUpdates.updated_at = new Date().toISOString();
    await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', request.profile_id);
  }

  // 2. Kontakt-Tabelle aktualisieren
  if (Object.keys(contactUpdates).length > 0) {
    await supabase
      .from('profile_contacts')
      .update({ ...contactUpdates, updated_at: new Date().toISOString() })
      .eq('profile_id', request.profile_id);
  }

  // 3. Kategorien aktualisieren
  if (categoryIds !== null) {
    await supabase
      .from('profile_categories')
      .delete()
      .eq('profile_id', request.profile_id);
      
    if (categoryIds.length > 0) {
      await supabase
        .from('profile_categories')
        .insert(categoryIds.map(id => ({
          profile_id: request.profile_id,
          category_id: id
        })));
    }
  }

  // 4. Foto-Änderungen verarbeiten
  await processPhotoChanges(request);
};
```

### 3. Foto-Änderungen verarbeiten

```typescript
const processPhotoChanges = async (request: ChangeRequest) => {
  const changeGroups = parseDescription(request.description);
  const photoGroup = changeGroups?.find(g => g.type === 'photos');
  if (!photoGroup) return;

  for (const change of photoGroup.changes) {
    // Fotos löschen
    if (change.field === 'delete_photos' && change.new_value) {
      const idsToDelete = change.new_value.split(',');
      for (const photoId of idsToDelete) {
        const { data: photo } = await supabase
          .from('photos')
          .select('storage_path')
          .eq('id', photoId)
          .single();
          
        if (photo) {
          await supabase.storage.from('profile-photos').remove([photo.storage_path]);
          await supabase.from('photos').delete().eq('id', photoId);
        }
      }
    }
    
    // Primäres Foto ändern
    if (change.field === 'primary_photo' && change.new_value) {
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('profile_id', request.profile_id);
      await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', change.new_value);
    }
    
    // Neue Fotos von change-request-media nach profile-photos kopieren
    if (change.field === 'new_photos') {
      const media = mediaUrls[request.id];
      if (media?.length) {
        for (const m of media) {
          // Datei von change-request-media laden
          const { data: fileData } = await supabase.storage
            .from('change-request-media')
            .download(m.storage_path);
            
          if (fileData) {
            // In profile-photos hochladen
            const newPath = `${request.profile_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
            await supabase.storage
              .from('profile-photos')
              .upload(newPath, fileData);
              
            // DB-Eintrag erstellen
            await supabase.from('photos').insert({
              profile_id: request.profile_id,
              storage_path: newPath,
              is_primary: false,
              media_type: 'image'
            });
          }
        }
      }
    }
  }
};
```

### 4. Mutation erweitern

```typescript
const updateStatusMutation = useMutation({
  mutationFn: async ({ requestId, status, adminNote }) => {
    const request = requests?.find(r => r.id === requestId);
    
    // Bei Genehmigung: Änderungen auf das Profil anwenden!
    if (status === 'approved' && request) {
      await applyChangesToProfile(request);
    }

    // Status aktualisieren
    const { error } = await supabase
      .from('profile_change_requests')
      .update({ status, admin_note: adminNote || null, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
  },
  onSuccess: () => {
    // Cache für Live-Profil invalidieren
    queryClient.invalidateQueries({ queryKey: ['admin-change-requests'] });
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    queryClient.invalidateQueries({ queryKey: ['profile-contacts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  }
});
```

### 5. Bestehendes Profil korrigieren

Für das bereits inkonsistente Profil (sermon9cw7@psovv.com):

```sql
-- Korrigiere payment_status für aktives Profil
UPDATE profiles 
SET payment_status = 'paid'
WHERE id = '06a895a5-9241-44f1-bbd2-efccdeee414d'
  AND status = 'active';
```

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| **AdminProfile.tsx** | Bei `status = 'active'` auch `payment_status = 'paid'` setzen |
| **AdminChangeRequests.tsx** | `applyChangesToProfile()` Funktion hinzufügen |
| **AdminChangeRequests.tsx** | `processPhotoChanges()` für Foto-Handling |
| **AdminChangeRequests.tsx** | Mutation erweitern: Änderungen bei Genehmigung anwenden |
| **AdminChangeRequests.tsx** | Cache-Invalidierung für Live-Profil |
| **Datenbank** | Korrektur für bestehendes inkonsistentes Profil |

---

## Sicherheit & Datenintegrität

- Nur bei `status === 'approved'` werden Änderungen angewandt
- `payment_status = 'free'` wird bei Admin-Aktivierung nicht überschrieben
- Foto-Kopierung erfolgt mit korrektem Storage-Bucket-Wechsel
- Cache wird nach Änderungen invalidiert für sofortige UI-Aktualisierung
