
# "Profil aktualisieren" Button nach unten verschieben

## Problem
Der "Profil aktualisieren" Button ist aktuell innerhalb der ProfileForm-Komponente (oben). Der User möchte ihn unten beim Hinweis-Bereich haben.

## Lösung

### 1. ProfileForm.tsx anpassen
- Den internen Submit-Button entfernen
- Stattdessen eine `ref` oder `id` für das Formular hinzufügen, damit es extern submitted werden kann
- Neue optionale Props: `showSubmitButton` (default: true) und `formId`

```tsx
// ProfileForm.tsx - Änderungen
interface ProfileFormProps {
  // ... bestehende Props
  formId?: string;           // NEU: ID für externes Submit
  showSubmitButton?: boolean; // NEU: Button intern anzeigen?
}

// Im Form-Tag:
<form id={formId} onSubmit={...}>

// Submit-Button am Ende:
{showSubmitButton !== false && (
  <Button type="submit" className="w-full" disabled={isSubmitting}>
    {isSubmitting ? 'Wird gespeichert...' : submitButtonText}
  </Button>
)}
```

### 2. ProfileEdit.tsx anpassen
- `formId="profile-edit-form"` an ProfileForm übergeben
- `showSubmitButton={false}` setzen
- Button unten im Footer-Bereich hinzufügen mit `form="profile-edit-form"`

```tsx
// ProfileEdit.tsx - ProfileForm Aufruf
<ProfileForm
  formId="profile-edit-form"
  showSubmitButton={false}
  onSubmit={handleFormSubmit}
  // ... restliche Props
/>

// Footer-Bereich mit beiden Buttons
<div className="mt-8 p-4 bg-muted/50 rounded-lg">
  <div className="flex flex-col gap-4">
    <div className="text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Hinweis:</p>
      <p>Foto-Uploads werden sofort gespeichert.</p>
      {isActiveProfile && (
        <p className="text-orange-600 mt-1">
          ⚠️ Nach dem Speichern muss dein Profil erneut geprüft werden.
        </p>
      )}
    </div>
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        type="submit"
        form="profile-edit-form"
        disabled={isSubmitting}
        className="sm:flex-1"
      >
        {isSubmitting ? 'Wird gespeichert...' : 'Profil aktualisieren'}
      </Button>
      <Button 
        variant="outline" 
        onClick={() => navigate('/mein-profil')}
      >
        ← Zurück ohne Speichern
      </Button>
    </div>
  </div>
</div>
```

## Technische Details

| Datei | Änderung |
|-------|----------|
| `ProfileForm.tsx` | Neue Props `formId` und `showSubmitButton` hinzufügen |
| `ProfileEdit.tsx` | Button unten platzieren, Hinweistext anpassen |

## Resultat
- "Profil aktualisieren" Button ist jetzt unten neben "Zurück ohne Speichern"
- User sieht beide Optionen direkt nebeneinander
- Klarer Call-to-Action am Ende der Seite
