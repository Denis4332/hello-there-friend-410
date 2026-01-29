
# Safari Favicon Cache-Buster Fix

## Status: Bestätigt

Das Bild das du hochgeladen hast (zwei rote Herzen, Outline-Stil) ist **EXAKT IDENTISCH** mit dem aktuellen `/favicon-hearts.png` im Projekt.

**Server-seitig ist alles korrekt!** Das Problem ist ausschliesslich Safari-Cache auf deinem Gerät.

---

## Plan: Cache-Buster implementieren

### Schritt 1: Query-String zu Favicon-Links hinzufügen

Datei: `index.html`

**Vorher:**
```html
<link rel="icon" type="image/png" href="/favicon-hearts.png">
<link rel="apple-touch-icon" href="/apple-touch-icon-hearts.png">
```

**Nachher:**
```html
<link rel="icon" type="image/png" href="/favicon-hearts.png?v=3">
<link rel="apple-touch-icon" href="/apple-touch-icon-hearts.png?v=3">
```

### Schritt 2: PWA Manifest updaten (falls vorhanden)

Prüfen ob `vite.config.ts` PWA-Icons referenziert und dort ebenfalls `?v=3` anhängen.

---

## Technische Erklärung

Safari speichert Favicons in einer SQLite-Datenbank:
- Pfad: `~/Library/Safari/Favicon Cache/`
- Diese Datenbank ignoriert sogar Inkognito-Modus
- Nur Cache-Busting (neuer Query-String) oder manuelles Löschen hilft

Der `?v=3` Parameter zwingt Safari, das Icon als "neue Ressource" zu behandeln und lädt es frisch vom Server.

---

## Erwartetes Ergebnis nach Deploy

Nach dem Update und einem normalen Seiten-Refresh sollte Safari das korrekte Favicon zeigen - ohne dass du manuell Cache löschen musst.

---

## Risiko: Minimal

Dies ändert nur URL-Parameter, nicht die eigentlichen Bilddateien. Alle Browser laden das Icon neu, was bei jedem Browser-Cache-Problem hilft.
