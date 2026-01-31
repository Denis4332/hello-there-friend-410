

# CI Workflow vereinfachen

## Problem

Der aktuelle CI Workflow hat 5 Jobs (lint-and-format, type-check, test, build, bundle-size), die alle `test:coverage` und andere Scripts benötigen, die in `package.json` fehlen. Dies führt zu Build-Fehlern.

## Lösung

Den CI Workflow auf einen einfachen Build-Check reduzieren, wie vom User angegeben.

---

## Änderung

**Datei:** `.github/workflows/ci.yml`

Die gesamte Datei wird ersetzt mit:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build production bundle
        run: npm run build
      
      - name: Build successful
        run: echo "✅ Build completed successfully"
```

---

## Entfernte Jobs

| Job | Warum entfernt |
|-----|----------------|
| lint-and-format | Benötigt ESLint/Prettier Config |
| type-check | Optional für CI |
| test | Benötigt `test:coverage` Script |
| bundle-size | Optional für CI |

## Ergebnis

Der CI Workflow führt nur noch einen Build-Check durch. Das behebt den Fehler und beschleunigt die Pipeline.

