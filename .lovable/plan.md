
# Fixes für ProfileEdit: Button, Hauptfoto & Favoriten

## Identifizierte Probleme

### Problem 1: "Profil aktualisieren" Button funktioniert nicht
**Analyse:** Das `form.requestSubmit()` wird aufgerufen, aber das Formular validiert möglicherweise nicht oder es gibt einen stillen Fehler. Das Problem könnte sein, dass `requestSubmit()` in manchen Browsern anders funktioniert als erwartet. Zusätzlich fehlen Debug-Ausgaben um zu sehen ob das Formular überhaupt gefunden wird.

**Lösung:** 
- Debug-Logging hinzufügen
- Direkt auf das Form-Event setzen statt `requestSubmit()`
- Alternativ: Formular-Referenz via `useRef` statt DOM-Query

### Problem 2: Hauptfoto-Auswahl im PhotoUploader funktioniert nicht für existierende Fotos
**Analyse:** In `PhotoUploader.tsx` Zeilen 337-341:
```tsx
const setPrimary = (index: number) => {
  if (previews[index]?.mediaType === 'image') {
    setPrimaryIndex(index);  // ← Nur lokaler State!
  }
};
```

Der `setPrimary` in PhotoUploader ändert nur den lokalen `primaryIndex` State. Das ist für **neue** Fotos gedacht (die noch nicht hochgeladen wurden). 

Für **existierende** Fotos (bereits in DB) muss `handleSetPrimary` aus `ProfileEdit.tsx` verwendet werden - aber der PhotoUploader zeigt seine eigene UI mit dem Star-Button, die nicht die DB aktualisiert.

**Lösung:** 
- Für existierende Fotos (`preview.uploaded === true`) sollte der Star-Button die DB-Aktualisierung auslösen
- Neue Callback-Prop `onSetPrimary` an PhotoUploader übergeben
- Wenn ein Foto bereits hochgeladen ist, diese Funktion aufrufen statt nur den lokalen State zu ändern

### Problem 3: User kann eigenes Profil zu Favoriten hinzufügen
**Analyse:** In `ProfileCard.tsx` wird der Favorit-Button für ALLE Profile angezeigt. Es gibt keinen Check ob das angezeigte Profil dem eingeloggten User gehört.

**Lösung:**
- Neue Prop `isOwnProfile?: boolean` an ProfileCard
- Oder: `currentUserId` prop und Vergleich mit `profile.user_id`
- Wenn es das eigene Profil ist: Favorit-Button nicht anzeigen

---

## Technische Änderungen

### 1. ProfileEdit.tsx - Button-Fix

**Zeile 579-593:** Robusteres Form-Submit
```tsx
// VORHER: requestSubmit() ist unreliable
onClick={() => {
  let form = document.getElementById('profile-edit-form') as HTMLFormElement;
  if (!form) {
    form = document.querySelector('form') as HTMLFormElement;
  }
  if (form) {
    form.requestSubmit();
  }
}}

// NACHHER: Direkter submit mit Fehlerbehandlung + Debug
onClick={() => {
  const form = document.getElementById('profile-edit-form') as HTMLFormElement;
  console.log('Form gefunden:', !!form, form?.id);
  if (form) {
    // Trigger native form validation + submit
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    
    // Fallback: requestSubmit()
    if (!submitEvent.defaultPrevented) {
      form.requestSubmit();
    }
  } else {
    console.error('Form nicht gefunden!');
  }
}}
```

**Alternative (besser):** `type="submit"` mit `form` Attribut richtig verwenden:
```tsx
<Button 
  type="submit"
  form="profile-edit-form"  // ← Verknüpft Button mit Form via ID
  disabled={isSubmitting}
  className="sm:flex-1"
>
  {isSubmitting ? 'Wird gespeichert...' : 'Profil aktualisieren'}
</Button>
```

### 2. PhotoUploader.tsx - Hauptfoto-Fix

**Neue Prop hinzufügen:**
```tsx
interface PhotoUploaderProps {
  profileId: string;
  userId?: string;
  listingType?: 'basic' | 'premium' | 'top';
  onUploadComplete?: () => void;
  onSetPrimary?: (photoId: string) => void;  // NEU
}
```

**Star-Button Logik ändern (Zeile 420-439):**
```tsx
<button
  type="button"
  onClick={() => {
    // Für bereits hochgeladene Fotos: DB aktualisieren
    if (preview.uploaded && preview.id && onSetPrimary) {
      onSetPrimary(preview.id);
    } else {
      // Für neue, noch nicht hochgeladene Fotos: lokaler State
      setPrimary(index);
    }
  }}
  className={cn(
    "absolute top-2 left-2 p-1.5 rounded-full transition-all",
    (preview.uploaded ? preview.id === currentPrimaryId : index === primaryIndex)
      ? "bg-primary text-primary-foreground"
      : "bg-black/50 text-white/70 hover:text-yellow-400"
  )}
  title="Als Hauptfoto setzen"
>
  <Star className={cn(
    "w-4 h-4",
    (preview.uploaded ? preview.id === currentPrimaryId : index === primaryIndex) && "fill-current"
  )} />
</button>
```

**Neue Prop für aktuelles Primary-Foto ID:**
```tsx
interface PhotoUploaderProps {
  // ...existing props
  onSetPrimary?: (photoId: string) => void;
  currentPrimaryId?: string;  // ID des aktuellen Hauptfotos aus DB
}
```

### 3. ProfileEdit.tsx - PhotoUploader aufrufen mit neuen Props

```tsx
<PhotoUploader 
  profileId={profile.id}
  userId={user?.id}
  listingType={listingType}
  onUploadComplete={() => {
    loadData();
    setUploadSuccess(true);
  }}
  onSetPrimary={handleSetPrimary}  // NEU
  currentPrimaryId={photos.find(p => p.is_primary)?.id}  // NEU
/>
```

### 4. ProfileCard.tsx - Favoriten-Button für eigenes Profil ausblenden

**Neue Props:**
```tsx
interface ProfileCardProps {
  profile: Profile & {...};
  priority?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (profileId: string) => void;
  isTogglingFavorite?: boolean;
  currentUserId?: string;  // NEU: Aktueller User ID
}
```

**Favorit-Button bedingt anzeigen (Zeile 156-169):**
```tsx
// Nur anzeigen wenn es NICHT das eigene Profil ist
{currentUserId !== profile.user_id && (
  <button
    onClick={handleFavoriteClick}
    disabled={isToggling}
    className="absolute bottom-4 right-2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
    aria-label={isProfileFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
  >
    <Heart 
      className={cn(
        "h-5 w-5 transition-colors",
        isProfileFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
      )}
    />
  </button>
)}
```

### 5. Parent-Komponenten aktualisieren

Alle Stellen wo ProfileCard verwendet wird müssen `currentUserId` übergeben:
- `src/components/home/FeaturedProfilesSection.tsx`
- `src/components/search/SearchResults.tsx`
- `src/pages/UserFavorites.tsx`
- Eventuell andere

```tsx
import { useAuth } from '@/contexts/AuthContext';

// In der Komponente:
const { user } = useAuth();

<ProfileCard 
  profile={profile}
  currentUserId={user?.id}  // NEU
  // ...andere props
/>
```

---

## Zusammenfassung

| Datei | Änderung |
|-------|----------|
| `ProfileEdit.tsx` | Button mit `type="submit" form="..."` statt onClick |
| `PhotoUploader.tsx` | Neue Props `onSetPrimary` und `currentPrimaryId`, Logik für DB-Update |
| `ProfileCard.tsx` | Neue Prop `currentUserId`, Favorit-Button verstecken für eigenes Profil |
| `FeaturedProfilesSection.tsx` | `currentUserId` an ProfileCard übergeben |
| `SearchResults.tsx` | `currentUserId` an ProfileCard übergeben |
| `UserFavorites.tsx` | `currentUserId` an ProfileCard übergeben |

## Erwartetes Ergebnis
1. "Profil aktualisieren" Button funktioniert zuverlässig
2. Hauptfoto-Auswahl aktualisiert sofort die DB
3. Kein Favorit-Button auf dem eigenen Profil sichtbar
