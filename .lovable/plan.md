
# Favicon-Fix: Korrektes Herz-Logo einsetzen

## Ausgangslage

| Was | Status |
|-----|--------|
| `index.html` Zeilen 29-30 | ✅ Zeigt auf `/favicon.png` |
| `vite.config.ts` PWA manifest | ✅ Zeigt auf `/favicon.png` |
| `public/favicon.png` | ❌ **Falsches Bild** - muss ersetzt werden |

## Änderung

### Einzige Aktion: Favicon-Datei ersetzen

```text
user-uploads://Gold_and_White_Real_Estate_Agency_Logo_Template_-_1-3.png
                              ↓
                    public/favicon.png
```

| Datei | Aktion |
|-------|--------|
| `public/favicon.png` | **Überschreiben** mit dem hochgeladenen Doppel-Herz-Logo |

### Keine weiteren Änderungen nötig

- `index.html` - bleibt unverändert (zeigt bereits auf `/favicon.png`)
- `vite.config.ts` - bleibt unverändert (PWA icons zeigen auf `/favicon.png`)

## Sicherheitsbestätigung

**GPS, Rotation, Tiers, PayPort bleiben UNVERÄNDERT** - diese Änderung betrifft ausschließlich das Favicon-Bild.

## Nach dem Deploy: Test-Schritte

### Safari iOS
1. Einstellungen → Safari → Verlauf und Websitedaten löschen
2. Safari komplett schliessen (aus App Switcher wischen)
3. Website neu öffnen
4. Tab-Übersicht prüfen: Zwei rote Herzen sichtbar

### Chrome Desktop
1. Hard Refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
2. Tab-Favicon prüfen: Zwei rote Herzen
