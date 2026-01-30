
# Toast X-Button Fix + Bilder-Limit Validierung bei Paket-Wechsel

## Problem 1: Toast-Meldungen nicht wegklickbar

Die Toasts zeigen zwar einen X-Button, aber es gibt möglicherweise ein Z-Index oder Touch-Target Problem auf Mobile.

### Lösung
In `src/components/ui/toast.tsx` den ToastClose Button größer und besser klickbar machen:

```tsx
// Zeile 69-71 - größeres Touch-Target und bessere Sichtbarkeit
className={cn(
  "absolute right-2 top-2 rounded-md p-2 text-foreground/50 opacity-100 transition-opacity hover:text-foreground focus:outline-none focus:ring-2",
  // p-1 → p-2 für größeres Klick-Target auf Mobile
  className,
)}
```

---

## Problem 2: Bilder-Limit beim Paket-Wechsel nicht geprüft

Aktuell kann jemand:
1. TOP AD wählen → 15 Fotos hochladen
2. Zurück zu "Paket ändern" → Basic wählen
3. Mit 15 Fotos als Basic-Inserat weitermachen (Exploit!)

### Lösung

In `src/pages/ProfileCreate.tsx` beim Paket-Wechsel prüfen, ob die hochgeladenen Fotos das neue Limit überschreiten.

**Neue Funktion:** `validateMediaForNewPackage()`

```tsx
// Foto/Video-Limits pro Paket
const MEDIA_LIMITS = {
  basic: { photos: 5, videos: 0 },
  premium: { photos: 10, videos: 1 },
  top: { photos: 15, videos: 2 },
};

const validateMediaForNewPackage = async (newType: 'basic' | 'premium' | 'top') => {
  if (!profileId) return true; // Keine Fotos = OK
  
  const limits = MEDIA_LIMITS[newType];
  
  // Aktuelle Medien aus DB holen
  const { data: photos } = await supabase
    .from('photos')
    .select('id, media_type')
    .eq('profile_id', profileId);
  
  if (!photos) return true;
  
  const imageCount = photos.filter(p => p.media_type === 'image' || !p.media_type).length;
  const videoCount = photos.filter(p => p.media_type === 'video').length;
  
  if (imageCount > limits.photos || videoCount > limits.videos) {
    toast({
      title: 'Zu viele Medien',
      description: `${newType.toUpperCase()} erlaubt max. ${limits.photos} Fotos${limits.videos > 0 ? ` und ${limits.videos} Video(s)` : ''}. Du hast ${imageCount} Fotos${videoCount > 0 ? ` und ${videoCount} Videos` : ''}. Bitte lösche erst überzählige Medien.`,
      variant: 'destructive',
    });
    return false;
  }
  
  return true;
};
```

**Anpassungen:**

1. **ListingTypeSelector `onContinue`** - Vor dem Weiter prüfen:
```tsx
const handleListingTypeSubmit = async () => {
  // NEU: Medien-Limit prüfen bevor gespeichert wird
  const isValid = await validateMediaForNewPackage(listingType);
  if (!isValid) return;
  
  // ... Rest bleibt gleich
};
```

2. **PaymentMethodModal "Ändern" Button** - Auch hier prüfen beim Wechsel zurück

---

## Zusammenfassung

| Datei | Änderung |
|-------|----------|
| `toast.tsx` | ToastClose Button größer (p-2 statt p-1) |
| `ProfileCreate.tsx` | `validateMediaForNewPackage()` Funktion + Aufruf in `handleListingTypeSubmit` |

## Ergebnis

- ✅ Toast-Meldungen auf Mobile/Desktop wegklickbar
- ✅ Downgrade von TOP→Basic blockiert wenn zu viele Fotos
- ✅ Nutzer müssen erst überzählige Medien löschen
