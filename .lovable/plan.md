
# Bug-Fix: PaymentMethodModal onChangePackage Validierung entfernen

## Problem

In der `onChangePackage` Callback-Funktion (Zeile 515-521) wird `validateMediaForNewPackage(listingType)` aufgerufen:

```tsx
onChangePackage={async () => {
  // Auch hier prüfen ob Downgrade erlaubt ist
  const isValid = await validateMediaForNewPackage(listingType);  // ← BUG!
  if (!isValid) return;
  setShowPaymentModal(false);
  setCurrentStep('listing-type');
}}
```

**Das Problem:** `listingType` ist das **aktuell gewählte** Paket. Der Callback führt den User nur zurück zur Paketauswahl - er hat noch gar kein neues Paket gewählt!

**Konsequenz:** Wenn jemand z.B. TOP AD gewählt hat und 10 Fotos hochgeladen hat, kann er nicht mal zur Paketauswahl zurück, obwohl er sein TOP AD behalten will. Die Validierung blockiert ihn fälschlicherweise.

## Lösung

Die Validierung im `onChangePackage` komplett entfernen. Die korrekte Validierung passiert bereits in `handleListingTypeSubmit` (Zeile 253-255), wenn der User tatsächlich ein neues Paket auswählt und auf "Weiter" klickt.

## Code-Änderung

**Datei:** `src/pages/ProfileCreate.tsx`

**Zeilen 515-521 ändern zu:**

```tsx
onChangePackage={() => {
  setShowPaymentModal(false);
  setCurrentStep('listing-type');
}}
```

## Warum das sicher ist

| Stelle | Prüfung | Status |
|--------|---------|--------|
| `handleListingTypeSubmit` (Z.253-255) | Validiert beim Klick auf "Weiter" nach Paketauswahl | ✅ Korrekt implementiert |
| `onChangePackage` | Führt nur zurück zur Paketauswahl | ❌ Validierung entfernen |

Die Medien-Limit-Prüfung erfolgt an der richtigen Stelle: Wenn der User ein Paket wählt und fortfahren will.
