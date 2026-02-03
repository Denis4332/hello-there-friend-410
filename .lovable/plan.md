
# Analyse: Edge Cases beim Änderungsanfrage-Flow

## Identifizierte Risiken

### 1. User navigiert zurück während Bild-Upload läuft
**Problem:** Bilder werden gerade hochgeladen, User drückt Browser-Zurück oder "Zurück zum Dashboard"
**Lösung:** Gleiche Logik wie PhotoUploader.tsx verwenden:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isUploading || selectedFiles.length > 0) {
      e.preventDefault();
      e.returnValue = 'Du hast Bilder ausgewählt. Wirklich verlassen?';
      return e.returnValue;
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isUploading, selectedFiles]);
```

### 2. User wählt Bilder aus, sendet aber nicht ab
**Problem:** Bilder sind lokal ausgewählt (Previews sichtbar), aber noch nicht in DB/Storage
**Lösung:** 
- Bilder existieren nur als `File[]` im State - kein Schaden bei Verlassen
- Warnung anzeigen wenn `selectedFiles.length > 0`
- Keine verwaisten Dateien möglich, da erst bei Submit hochgeladen wird

### 3. Upload-Fehler mitten im Prozess
**Problem:** 2 von 5 Bildern hochgeladen, dann Netzwerkfehler
**Lösung:**
- Transaktionale Logik: Erst alle Bilder zu Storage, dann Anfrage erstellen
- Bei Fehler: Bereits hochgeladene Bilder in diesem Request löschen
- User sieht Fehlermeldung, kann erneut versuchen
```typescript
try {
  // 1. Alle Bilder hochladen
  const uploadedPaths = await uploadAllImages(selectedFiles);
  
  // 2. Anfrage erstellen
  const { data: request } = await supabase
    .from('profile_change_requests')
    .insert({ ... })
    .select()
    .single();
  
  // 3. Medien-Einträge erstellen
  await supabase.from('change_request_media').insert(
    uploadedPaths.map(path => ({ request_id: request.id, storage_path: path }))
  );
} catch (error) {
  // Cleanup bei Fehler
  if (uploadedPaths.length > 0) {
    await supabase.storage.from('change-request-media').remove(uploadedPaths);
  }
  throw error;
}
```

### 4. User reloaded Seite während Formular ausgefüllt
**Problem:** Text und ausgewählte Bilder gehen verloren
**Lösung:**
- Text-Inputs bleiben verloren (akzeptabel, da kurze Formulare)
- Bilder müssen neu ausgewählt werden (akzeptabel)
- Bereits gesendete Anfragen bleiben erhalten und werden beim Reload geladen
- **Kein Datenverlust** da nichts in DB gespeichert wurde

### 5. Doppelter Submit
**Problem:** User klickt mehrfach auf "Anfrage senden"
**Lösung:** Bereits implementiert via `disabled={submitting}` Button-State

### 6. Session-Timeout während Upload
**Problem:** Auth-Token läuft ab während langer Upload-Prozess
**Lösung:**
- Supabase Client refresht Token automatisch
- Max 5 Bilder à 5MB = schneller Upload
- Falls doch Fehler: User sieht "Session abgelaufen, bitte neu einloggen"

---

## Implementierte Sicherheitsmassnahmen

| Edge Case | Lösung | Status |
|-----------|--------|--------|
| Zurück während Upload | `beforeunload` Event-Listener | Neu hinzufügen |
| Bilder ausgewählt, nicht gesendet | Warnung + kein DB-Eintrag | Neu hinzufügen |
| Upload-Fehler mitten drin | Transaktionale Logik + Cleanup | Neu implementieren |
| Seite reload | Formular leer, aber sicher | OK (akzeptabel) |
| Doppelter Submit | Button disabled während Submit | Bereits vorhanden |
| Session-Timeout | Supabase Auto-Refresh | Bereits vorhanden |

---

## Erweiterter Code für ProfileChangeRequest.tsx

### Neue States:
```typescript
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
```

### Browser-Warnung:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Warnung wenn Bilder ausgewählt oder Upload läuft
    if (isUploading || selectedFiles.length > 0) {
      e.preventDefault();
      e.returnValue = 'Du hast ungesendete Änderungen. Wirklich verlassen?';
      return e.returnValue;
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isUploading, selectedFiles]);
```

### Transaktionaler Upload:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!profile || !user || !requestType || !description.trim()) return;

  setSubmitting(true);
  const uploadedPaths: string[] = [];

  try {
    // 1. Bilder hochladen (falls vorhanden)
    if (selectedFiles.length > 0 && requestType === 'photos') {
      setIsUploading(true);
      setUploadProgress({ current: 0, total: selectedFiles.length });

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const path = `${profile.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('change-request-media')
          .upload(path, file);

        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        setUploadProgress({ current: i + 1, total: selectedFiles.length });
      }
      setIsUploading(false);
    }

    // 2. Anfrage erstellen
    const { data: request, error: requestError } = await supabase
      .from('profile_change_requests')
      .insert({
        profile_id: profile.id,
        user_id: user.id,
        request_type: requestType,
        description: description.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // 3. Medien-Einträge erstellen
    if (uploadedPaths.length > 0) {
      const mediaInserts = uploadedPaths.map(path => ({
        request_id: request.id,
        storage_path: path,
      }));

      const { error: mediaError } = await supabase
        .from('change_request_media')
        .insert(mediaInserts);

      if (mediaError) throw mediaError;
    }

    toast({
      title: 'Anfrage gesendet',
      description: 'Deine Änderungsanfrage wurde eingereicht.',
    });

    // Reset
    setRequestType('');
    setDescription('');
    setSelectedFiles([]);
    loadData();

  } catch (error) {
    // CLEANUP: Bei Fehler bereits hochgeladene Bilder löschen
    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from('change-request-media')
        .remove(uploadedPaths);
    }

    toast({
      title: 'Fehler',
      description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
      variant: 'destructive',
    });
  } finally {
    setSubmitting(false);
    setIsUploading(false);
  }
};
```

---

## Zusammenfassung

Die Implementierung berücksichtigt alle gängigen Edge Cases:

1. **Datenverlust verhindern** durch Browser-Warnung bei ungesendeten Änderungen
2. **Konsistenz gewährleisten** durch transaktionalen Upload mit Rollback
3. **Doppelte Aktionen verhindern** durch Button-Disabling während Submit
4. **Verwaiste Dateien verhindern** durch Cleanup bei Fehlern

Der User kann:
- Jederzeit sicher zurücknavigieren (mit Warnung falls nötig)
- Bei Fehlern erneut versuchen ohne Datenreste
- Den Fortschritt bei mehreren Bildern sehen
