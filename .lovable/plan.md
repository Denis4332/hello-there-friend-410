
# Fix: Signierte URLs für Verifizierungsfotos

## Problem
Der `verification-photos` Bucket ist privat (korrekt aus Sicherheitsgründen), aber `getPublicUrl()` funktioniert nur bei öffentlichen Buckets. Daher werden die Verifizierungsfotos nicht angezeigt (403 Forbidden).

## Lösung

### Datei: `src/pages/admin/AdminVerifications.tsx`

#### 1. Import erweitern (Zeile 1)
```typescript
import { useState, useMemo, useEffect } from 'react';
```

#### 2. Neuen State für signierte URLs hinzufügen (nach Zeile 18)
```typescript
const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
const [urlsLoading, setUrlsLoading] = useState(false);
```

#### 3. useEffect für das Laden der signierten URLs hinzufügen (nach den States)
```typescript
useEffect(() => {
  const loadSignedUrls = async () => {
    if (!verifications || verifications.length === 0) return;
    
    setUrlsLoading(true);
    const urls: Record<string, string> = {};
    
    for (const verification of verifications) {
      try {
        const { data, error } = await supabase.storage
          .from('verification-photos')
          .createSignedUrl(verification.storage_path, 3600); // 1 Stunde gültig
        
        if (data?.signedUrl && !error) {
          urls[verification.storage_path] = data.signedUrl;
        }
      } catch (err) {
        console.error('Error creating signed URL:', err);
      }
    }
    
    setSignedUrls(urls);
    setUrlsLoading(false);
  };
  
  loadSignedUrls();
}, [verifications]);
```

#### 4. getPhotoUrl-Funktion anpassen (Zeile 20-25)
```typescript
const getPhotoUrl = (storagePath: string) => {
  return signedUrls[storagePath] || '';
};
```

## Technische Details

| Aspekt | Wert |
|--------|------|
| URL-Gültigkeit | 1 Stunde (3600 Sekunden) |
| Sicherheit | Nur Admins können signierte URLs generieren (RLS) |
| Performance | URLs werden einmal beim Laden gecacht |
| Fallback | Leerer String wenn URL noch nicht geladen |

## Erwartetes Ergebnis

1. Admin öffnet `/admin/verifications`
2. Hook lädt alle pending Verifizierungen
3. useEffect generiert signierte URLs für alle Einträge
4. Bilder werden korrekt in Tabelle und Dialog angezeigt
5. Nach 1 Stunde: Seite neu laden für frische URLs
