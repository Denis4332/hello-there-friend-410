

# Fix: 10 Minuten Pause vor jedem Popup

## Problem

Das Popup erscheint aktuell sofort bei jedem Seitenwechsel. Der Zeitstempel wird zwar beim Schliessen gespeichert, aber nie geprüft.

## Lösung

Vor dem Anzeigen prüfen, ob seit dem letzten Popup mindestens 10 Minuten vergangen sind.

---

## Änderung

### Datei: `src/components/BannerManager.tsx`

**Zeile 9:** Konstante hinzufügen:
```typescript
const POPUP_COOLDOWN_MS = 10 * 60 * 1000; // 10 Minuten
```

**Zeile 35-43:** Cooldown-Prüfung einbauen:
```typescript
if (popupAds.length > 0) {
  const selectedAd = popupAds[0];
  const storageKey = `${STORAGE_KEY_PREFIX}${selectedAd.id}`;
  const lastShown = localStorage.getItem(storageKey);
  
  // Prüfe ob 10 Minuten seit letztem Popup vergangen sind
  if (lastShown) {
    const timeSinceLastShown = Date.now() - new Date(lastShown).getTime();
    if (timeSinceLastShown < POPUP_COOLDOWN_MS) {
      return; // Noch nicht genug Zeit vergangen
    }
  }
  
  const delay = selectedAd.popup_delay_seconds || 5;
  
  const timer = setTimeout(() => {
    setCurrentAd(selectedAd);
  }, delay * 1000);

  return () => clearTimeout(timer);
}
```

---

## Was bleibt unverändert

- Erlaubte Seiten (WHITELIST)
- Demo-Popup Logik
- Tracking (Impressions/Clicks)
- Delay vor dem Anzeigen
- handleClose Funktion

---

## Erwartetes Verhalten

1. User besucht Seite → Popup erscheint (erstmalig)
2. User schliesst Popup → Zeitstempel wird gespeichert
3. User navigiert → Kein Popup (10 Min Cooldown)
4. Nach 10 Minuten → Popup erscheint wieder

