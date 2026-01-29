
# Fix: Verifizierungsfotos in Admin-Tabelle anzeigen

## Problem

Die Verifizierungsfotos werden im Admin-Dashboard nicht in der Tabellen-Übersicht angezeigt, obwohl sie im "Prüfen"-Dialog sichtbar sind.

### Ursache

Die Signed URLs werden asynchron geladen. Wenn die Tabelle gerendert wird, sind die URLs noch nicht bereit. `getPhotoUrl()` gibt dann einen leeren String zurück.

**Aktueller Ablauf:**
```
1. Verifications laden (API-Call)
2. Tabelle rendert sofort mit leeren src=""
3. useEffect startet → URLs werden geladen
4. State updated → aber img-Tags sind schon "broken"
```

---

## Lösung

### Teil 1: Loading-State für Bilder hinzufügen

Zeige einen Skeleton/Platzhalter während die URLs laden.

**Datei:** `src/pages/admin/AdminVerifications.tsx`

**Zeile 19:** Loading-State hinzufügen:
```typescript
const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
const [urlsLoading, setUrlsLoading] = useState(true);
```

**Zeile 21-45:** Loading-State setzen:
```typescript
useEffect(() => {
  const loadSignedUrls = async () => {
    if (!verifications || verifications.length === 0) {
      setUrlsLoading(false);
      return;
    }
    
    setUrlsLoading(true);
    const urls: Record<string, string> = {};
    
    for (const verification of verifications) {
      try {
        const { data, error } = await supabase.storage
          .from('verification-photos')
          .createSignedUrl(verification.storage_path, 3600);
        
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

### Teil 2: Skeleton während URL-Laden anzeigen

**Zeile 181-187:** Conditional Rendering für Bilder:
```typescript
<td className="p-3">
  {urlsLoading || !signedUrls[verification.storage_path] ? (
    <div className="w-16 h-16 bg-muted animate-pulse rounded" />
  ) : (
    <img
      src={signedUrls[verification.storage_path]}
      alt="Verifizierung"
      className="w-16 h-16 object-cover rounded"
    />
  )}
</td>
```

---

## Teil 2: Favicon-Problem (Safari Cache)

Das Favicon zeigt in Safari/iOS ein falsches Icon wegen aggressivem Caching.

### Mögliche Lösungen:

1. **Dateinamen komplett ändern** (z.B. `favicon-v4.png`)
2. **Timestamp als Query-Parameter** statt `?v=3`
3. **Manifest.json aktualisieren** mit neuen Pfaden

Da Edge das richtige Icon zeigt, ist das Deployment korrekt. Das Problem ist rein clientseitiger Cache.

**Empfehlung:** 
- `/debug/icons` Seite nutzen um zu verifizieren dass die richtigen Dateien served werden
- Safari Cache manuell löschen: Einstellungen → Safari → Verlauf und Websitedaten löschen
- PWA neu installieren falls installiert

---

## Zusammenfassung

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Tabellen-Bilder fehlen | Async URL-Loading | Loading-State + Skeleton |
| Dialog-Bilder funktionieren | URLs sind dann bereit | - |
| Falsches Favicon (Safari) | Browser-Cache | Cache löschen / Dateinamen ändern |

---

## Erwartetes Ergebnis

Nach dem Fix:
- Tabellen-Übersicht zeigt Skeleton während URLs laden
- Dann erscheinen die Verifizierungsfotos korrekt
- Dialog zeigt weiterhin Bilder wie bisher
