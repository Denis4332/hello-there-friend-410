
# Favicon-Bereinigung Plan

## Aktueller Zustand (Probleme)

| Datei | Zeile | Problem |
|-------|-------|---------|
| `index.html` | 29-30 | Externe JPEG-URLs mit Leerzeichen (`WhatsApp Image...`) |
| `vite.config.ts` | 36-44 | PWA manifest icons zeigen auf externe JPEG-URLs |
| `vite.config.ts` | 28 | `includeAssets` enthält kein favicon |
| `public/` | - | **Keine lokale favicon.png vorhanden!** |

### Warum Safari 2 Favicons zeigt:
1. Externe URL mit Leerzeichen kann zu Encoding-Problemen führen
2. Safari cached aggressiv und zeigt evtl. alte + neue Version
3. PWA manifest und index.html haben beide Favicon-Definitionen

---

## Änderungen

### 1. Neue Datei erstellen

**`public/favicon.png`** (muss vom User bereitgestellt werden)
- Format: PNG
- Größe: 256x256px (skaliert gut für alle Anwendungen)
- Inhalt: Herz-Icon OHNE weißen Rand

**`public/apple-touch-icon.png`** (optional, 180x180px)
- Kann Kopie von favicon.png sein

---

### 2. index.html anpassen

**Zeilen 29-30 ersetzen:**

```html
<!-- VORHER (Lines 29-30): -->
<link rel="icon" type="image/jpeg" href="https://storage.googleapis.com/gpt-engineer-file-uploads/.../WhatsApp Image....jpeg">
<link rel="apple-touch-icon" href="https://storage.googleapis.com/gpt-engineer-file-uploads/.../WhatsApp Image....jpeg">

<!-- NACHHER: -->
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
```

---

### 3. vite.config.ts anpassen

**Zeile 28 - includeAssets erweitern:**
```typescript
// VORHER:
includeAssets: ['robots.txt'],

// NACHHER:
includeAssets: ['favicon.png', 'robots.txt'],
```

**Zeilen 34-45 - PWA manifest icons auf lokale PNGs:**
```typescript
// VORHER:
icons: [
  {
    src: 'https://storage.googleapis.com/.../WhatsApp Image....jpeg',
    sizes: '192x192',
    type: 'image/jpeg'
  },
  {
    src: 'https://storage.googleapis.com/.../WhatsApp Image....jpeg',
    sizes: '512x512',
    type: 'image/jpeg'
  }
]

// NACHHER:
icons: [
  {
    src: '/favicon.png',
    sizes: '192x192',
    type: 'image/png'
  },
  {
    src: '/favicon.png',
    sizes: '512x512',
    type: 'image/png'
  }
]
```

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `public/favicon.png` | NEU erstellen (User muss Bild liefern) |
| `index.html` | Zeilen 29-30: Externe URLs → `/favicon.png` |
| `vite.config.ts` | Zeile 28: `includeAssets` erweitern |
| `vite.config.ts` | Zeilen 34-45: Icons auf lokale PNGs |

---

## Bestätigung

**GPS/Rotation/Tiers/PayPort bleiben unverändert** - dieser Plan berührt NUR:
- `index.html` (Favicon-Links)
- `vite.config.ts` (PWA manifest)
- `public/` (neue Datei)

---

## Voraussetzung

**Du musst mir das Favicon-Bild als Upload bereitstellen**, bevor ich die Änderungen durchführen kann:
- Das rechte Herz-Icon OHNE weißen Rand
- PNG-Format
- Ideale Größe: 256x256px oder 512x512px

---

## Test nach Deploy

1. **Safari iOS:**
   - Einstellungen → Safari → Verlauf und Websitedaten löschen
   - Safari komplett schließen (aus App Switcher)
   - Website neu öffnen
   - Tab-Übersicht prüfen: NUR 1 Icon

2. **Chrome Desktop:**
   - Hard Refresh (Cmd+Shift+R)
   - Tab-Favicon prüfen

3. **PWA Installation:**
   - "Zum Home-Bildschirm" testen
   - Icon auf Homescreen = korrektes Herz
