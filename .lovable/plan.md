

# Saubere Synchronisation: "Paket ändern" Flow

## Das Problem

Wenn du auf **"Paket ändern"** klickst:
1. Du wirst zu `/profil/erstellen` geleitet
2. ABER: Weil du bereits Fotos hast, springt das System automatisch zum Verifizierungs-Step
3. Du landest NICHT bei der Paketauswahl

## Die saubere Lösung

**Nur 2 minimale Änderungen** - keine neue Logik, nur eine Erweiterung:

### Änderung 1: UserDashboard.tsx (Zeile 438)

```tsx
// VORHER:
onClick={() => navigate('/profil/erstellen')}

// NACHHER:
onClick={() => navigate('/profil/erstellen?step=listing-type')}
```

### Änderung 2: ProfileCreate.tsx (Zeile 81-88)

```tsx
// VORHER:
if (!existingProfile.listing_type) {
  setCurrentStep('listing-type');
} else if (!photos || photos.length === 0) {
  setCurrentStep('photos');
} else {
  setCurrentStep('verification');
}

// NACHHER:
const urlParams = new URLSearchParams(window.location.search);
const requestedStep = urlParams.get('step');

// URL-Parameter hat Priorität (für "Paket ändern")
if (requestedStep === 'listing-type') {
  setCurrentStep('listing-type');
} else if (!existingProfile.listing_type) {
  setCurrentStep('listing-type');
} else if (!photos || photos.length === 0) {
  setCurrentStep('photos');
} else {
  setCurrentStep('verification');
}
```

## Warum das sauber ist

- **Bestehende Logik bleibt unverändert** - normaler Erstellungsflow funktioniert exakt wie vorher
- **Nur ein URL-Parameter** - keine neuen States, keine komplexen Conditions
- **Keine Datenbank-Änderungen** - alles rein Frontend
- **Rückwärtskompatibel** - ohne `?step=` Parameter verhält sich alles wie bisher

## Benutzer-Flow nach dem Fix

```
User mit unbezahltem Profil:

1. Dashboard → "Paket ändern" klicken
2. → /profil/erstellen?step=listing-type
3. → Landet DIREKT bei Paketauswahl ✓
4. → Wählt neues Paket, geht zur Zahlung
```

## Zusammenfassung

| Datei | Zeile | Änderung |
|-------|-------|----------|
| `UserDashboard.tsx` | 438 | `?step=listing-type` Parameter hinzufügen |
| `ProfileCreate.tsx` | 81-88 | URL-Parameter vor automatischer Step-Detection prüfen |

