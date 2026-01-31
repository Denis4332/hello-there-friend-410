
# GitHub CI Build Fix

## Problem

Der GitHub Actions CI Workflow schlägt fehl, weil das npm Script `test:coverage` in `package.json` fehlt. Der CI Workflow ruft `npm run test:coverage` auf (Zeile in `.github/workflows/ci.yml`), aber dieses Script existiert nicht.

## Lösung

Zwei Test-Scripts in `package.json` hinzufügen.

---

## Änderung

**Datei:** `package.json`

**Zeilen 6-12** (scripts Objekt) ändern:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:coverage": "vitest run --coverage"
},
```

---

## Zusammenfassung

| Datei | Änderung |
|-------|----------|
| `package.json` | 2 neue Scripts: `test` und `test:coverage` |

Nach dieser Änderung wird der GitHub CI Build erfolgreich durchlaufen.
