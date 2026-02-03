

# Fix: Flash of Unstyled Content (FOUC) verhindern

## Problem
Die Seite kann kurzzeitig "komisch" aussehen, weil:
1. Die App rendert BEVOR die Design-Settings aus der Datenbank geladen sind
2. Während des Ladens sind CSS-Variablen entweder leer oder zeigen Fallback-Werte
3. Nach dem Laden "springt" die UI zu den korrekten Farben

## Lösung

### Schritt 1: Loading-State in SiteSettingsProvider
Zeige einen minimalen Loading-Screen, bis die kritischen Design-Settings geladen sind.

**Datei: `src/contexts/SiteSettingsContext.tsx`**
```
- Prüfe isLoading im Provider
- Zeige kurzen Spinner/Blank-Screen bis Settings da sind
- Verhindert das Flackern komplett
```

### Schritt 2: Fallback-Werte in useDesignSettings verstärken
Falls Settings noch nicht geladen sind, verwende die CSS-Defaults aus index.css.

**Datei: `src/hooks/useDesignSettings.ts`**
```
- Keine CSS-Variablen setzen wenn getSetting('') leer zurückgibt
- Lasse die CSS-Defaults aus index.css aktiv
- Erst überschreiben wenn echte Werte vorhanden
```

### Schritt 3: Critical CSS Inline (optional, Performance-Boost)
Die wichtigsten Design-Variablen könnten auch direkt in index.html eingebettet werden.

---

## Erwartetes Ergebnis
- Kein Flackern mehr beim Laden
- Seite sieht von Anfang an korrekt aus
- Schnellerer gefühlter Seitenaufbau

## Technische Details

### Änderung 1: SiteSettingsContext.tsx
```typescript
export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { settings, getSetting, isLoading } = useBatchSiteSettings();

  // Zeige minimalen Loading-State für kritische Settings
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" />
    );
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, getSetting, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
```

### Änderung 2: useDesignSettings.ts (bereits korrekt)
Die aktuelle Implementierung prüft bereits `if (primaryColor)` - das Problem ist nur, dass die App VOR dem Laden schon rendert.

---

## Risiko
**Gering** - Die Änderung fügt nur einen kurzen Loading-State hinzu. Die CSS-Defaults aus index.css bleiben als Fallback erhalten.

