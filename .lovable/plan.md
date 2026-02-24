

# Fix Plan: Canton/Stadt-Verlust, lat/lng, und Foto-Upload Status

Alle 4 Fixes sind **lokal** und beeinflussen keine anderen Features (GPS-Filter, Kantone-Suche, etc.).

---

## Fix 1: `src/pages/ProfileEdit.tsx` — lat/lng zum State-Typ (Zeile 55-57)

Füge `lat?: number; lng?: number;` hinzu:

```typescript
    street_address?: string;
    show_street?: boolean;
    lat?: number;
    lng?: number;
  } | null>(null);
```

## Fix 2: `src/pages/ProfileEdit.tsx` — as any entfernen (Zeile 398-399)

```typescript
// Von:
lat: (profile as any).lat || undefined,
lng: (profile as any).lng || undefined,
// Zu:
lat: profile.lat ?? undefined,
lng: profile.lng ?? undefined,
```

## Fix 3: `src/pages/ProfileEdit.tsx` — handleUploadComplete robust (Zeile 350-359)

Ersetze `ensurePendingIfActive()` durch direktes DB-Update:

```typescript
  const handleUploadComplete = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'pending' })
        .eq('id', profile!.id)
        .eq('status', 'active');
      
      if (!error) {
        console.log('[ProfileEdit] Profile set to pending after upload');
      }
    } catch (error) {
      console.error('[ProfileEdit] Failed to set pending after upload:', error);
    }
    await loadData();
    setUploadSuccess(true);
  };
```

## Fix 4: `src/components/profile/ProfileForm.tsx` — lat/lng optional (Zeile 37-39)

```typescript
// Von:
lat: z.number({ required_error: 'Bitte Adresse auswählen' }),
lng: z.number({ required_error: 'Bitte Adresse auswählen' }),
// Zu:
lat: z.number().optional(),
lng: z.number().optional(),
```

## Fix 5: `src/components/profile/sections/LocationSection.tsx` — initializedRef (Zeile 59-61, 135-143)

Neuer Ref nach Zeile 60:
```typescript
const initializedRef = useRef(false);
```

Canton onValueChange (Zeile 135-143):
```typescript
onValueChange={(value) => {
  setValue('canton', value);
  if (!initializedRef.current) {
    initializedRef.current = true;
    return;
  }
  if (selectedCanton !== value) {
    setValue('city', '');
    setValue('postal_code', '');
    setValue('lat', undefined);
    setValue('lng', undefined);
  }
}}
```

---

## Sicherheitscheck: Was wird NICHT beeinflusst

| Feature | Warum sicher |
|---------|-------------|
| GPS-basierte Suche/Filter | lat/lng werden nur **optional** im Formular-Schema, die DB-Spalte und Suche bleiben unverändert |
| Kanton-Dropdown | initializedRef blockiert nur den **ersten** Mount-Aufruf, danach funktioniert alles normal |
| Google Places Autocomplete | Keine Änderung an der Google Places Logik |
| Profil-Erstellung | Neue Profile setzen lat/lng weiterhin über Google Places |
| Admin-Bereich | Keine Änderung an Admin-Logik |

