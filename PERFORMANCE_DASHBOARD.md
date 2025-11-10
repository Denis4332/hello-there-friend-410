# Performance Dashboard

## Übersicht

Das Admin Performance Dashboard bietet eine umfassende Visualisierung der Web Vitals Metriken, segmentiert nach Gerätetyp (Mobile, Desktop, Tablet). Es nutzt die in `localStorage` gespeicherten Performance-Daten, die durch die erweiterte `webVitals.ts` erfasst werden.

## Zugriff

**URL**: `/admin/performance`

**Authentifizierung**: Erfordert Admin-Login

## Features

### 1. Overview Cards

Zeigt die Anzahl der gesammelten Messungen pro Gerätetyp:
- **Mobile Messungen**: Anzahl der Mobile Web Vitals
- **Desktop Messungen**: Anzahl der Desktop Web Vitals
- **Tablet Messungen**: Anzahl der Tablet Web Vitals

### 2. Device-Type Distribution

**Visualisierung**: Pie Chart

Zeigt die prozentuale Verteilung der Messungen nach Gerätetyp:
- Mobile (Primary Color)
- Desktop (Accent Color)
- Tablet (Secondary Color)

**Use Case**: Verstehen, welche Geräte am häufigsten verwendet werden.

### 3. Metrics Overview (pro Gerätetyp)

**Visualisierung**: Card-basierte Übersicht

Für jeden Gerätetyp (Mobile/Desktop/Tablet):

#### Angezeigte Metriken:
- **LCP** (Largest Contentful Paint)
  - ✅ Gut: < 2.5s
  - ⚠️ OK: 2.5s - 4.0s
  - ✗ Schlecht: > 4.0s

- **FCP** (First Contentful Paint)
  - ✅ Gut: < 1.8s
  - ⚠️ OK: 1.8s - 3.0s
  - ✗ Schlecht: > 3.0s

- **CLS** (Cumulative Layout Shift)
  - ✅ Gut: < 0.1
  - ⚠️ OK: 0.1 - 0.25
  - ✗ Schlecht: > 0.25

- **INP** (Interaction to Next Paint)
  - ✅ Gut: < 200ms
  - ⚠️ OK: 200ms - 500ms
  - ✗ Schlecht: > 500ms

- **TTFB** (Time to First Byte)
  - ✅ Gut: < 800ms
  - ⚠️ OK: 800ms - 1800ms
  - ✗ Schlecht: > 1800ms

#### Pro Metrik angezeigt:
- **Durchschnitt (Avg)**: Mittelwert aller Messungen
- **Minimum (Min)**: Niedrigster gemessener Wert
- **Maximum (Max)**: Höchster gemessener Wert
- **Anzahl**: Gesamtanzahl der Messungen
- **Rating-Distribution**:
  - Gut (grün)
  - OK (gelb)
  - Schlecht (rot)

### 4. Performance Trends

**Visualisierung**: Line Charts (Recharts)

Zeigt den Verlauf der **letzten 10 Messungen** pro Metrik:
- X-Achse: Messungsnummer (1-10)
- Y-Achse: Metrik-Wert (ms oder dimensionslos)
- Linie: Verbindung der Messpunkte

**Use Case**: 
- Erkennen von Performance-Verschlechterungen
- Verifizieren von Optimierungen
- Identifizieren von Mustern

### 5. Tabs für Gerätetypen

Drei separate Tabs für:
- 📱 **Mobile**
- 💻 **Desktop**
- 📱 **Tablet**

Jeder Tab zeigt:
1. Metrics Overview (siehe oben)
2. Performance Trends (siehe oben)

## Datenquellen

### localStorage Keys

Die Daten werden in `localStorage` unter folgenden Keys gespeichert:
- `webVitals_mobile`: Array von Mobile-Metriken
- `webVitals_desktop`: Array von Desktop-Metriken
- `webVitals_tablet`: Array von Tablet-Metriken

### Datenstruktur

```typescript
interface WebVitalMetric {
  name: string;        // 'LCP', 'FCP', 'CLS', 'INP', 'TTFB'
  value: number;       // Metrik-Wert
  rating: string;      // 'good', 'needs-improvement', 'poor'
  timestamp: number;   // Unix timestamp
}
```

### Limits

- **Max Entries pro Device**: 10 Messungen pro Metrik
- **Automatische Rotation**: Älteste Messungen werden überschrieben
- **Persistenz**: Daten bleiben bis zum Löschen im Browser

## Verwendung

### 1. Daten sammeln

```typescript
// Automatisch beim Seitenaufruf (main.tsx)
import { trackWebVitals } from '@/utils/webVitals';

trackWebVitals(); // Startet automatisches Tracking
```

### 2. Dashboard aufrufen

1. Als Admin anmelden: `/admin/login`
2. Navigieren zu: `/admin/performance`
3. Dashboard analysieren

### 3. Daten aktualisieren

Klicke auf **"Aktualisieren"** Button, um die neuesten Daten zu laden.

### 4. Daten löschen

Klicke auf **"Daten löschen"** Button, um alle Performance-Daten zu entfernen.

**Warnung**: Dies löscht alle historischen Daten unwiderruflich!

## Interpretation

### Metrics Overview

#### ✅ Gute Performance
```
LCP: 1847ms (Gut)
FCP: 952ms (Gut)
CLS: 0.03 (Gut)
INP: 89ms (Gut)
TTFB: 342ms (Gut)
```

**Empfehlung**: Weiter optimieren, Status beibehalten.

#### ⚠️ Verbesserungsbedarf
```
LCP: 3200ms (OK)
CLS: 0.18 (OK)
```

**Empfehlung**:
- LCP: Bildoptimierung, CDN, Prefetching
- CLS: Layout-Stabilität, reservierte Platzhalter

#### ✗ Kritisch
```
LCP: 5200ms (Schlecht)
INP: 680ms (Schlecht)
```

**Empfehlung**:
- LCP: Sofortige Optimierung erforderlich
- INP: JavaScript-Bundle reduzieren, Virtual Scrolling

### Performance Trends

#### Positiver Trend
```
Messung: 1  2  3  4  5  6  7  8  9  10
LCP:     3k 2.8k 2.6k 2.4k 2.2k 2k 1.9k 1.8k 1.7k 1.6k
```

**Interpretation**: Kontinuierliche Verbesserung durch Optimierungen.

#### Negativer Trend
```
Messung: 1  2  3  4  5  6  7  8  9  10
LCP:     2k 2.2k 2.4k 2.6k 2.8k 3k 3.2k 3.4k 3.6k 3.8k
```

**Interpretation**: Performance verschlechtert sich. Regressions-Analyse erforderlich.

#### Instabiler Trend
```
Messung: 1  2  3  4  5  6  7  8  9  10
LCP:     2k 3k 1.8k 3.2k 1.9k 3.1k 2k 3k 1.9k 3k
```

**Interpretation**: 
- Inkonsistente Performance
- Möglicherweise netzwerkabhängig
- Cache-Probleme

## Optimierungs-Workflow

### 1. Baseline erfassen
```bash
# 1. Seite mehrmals besuchen (verschiedene Geräte)
# 2. Dashboard öffnen
# 3. Baseline-Werte notieren
```

### 2. Optimierung durchführen
```bash
# Beispiel: Responsive Images implementieren
git checkout -b feature/responsive-images
# ... Änderungen vornehmen
git commit -m "Add responsive images"
```

### 3. Performance messen
```bash
# 1. Build erstellen
npm run build

# 2. Preview starten
npm run preview

# 3. Seite mehrmals besuchen
# 4. Dashboard prüfen
```

### 4. Vergleich
```typescript
// Vor Optimierung
LCP Mobile: 3200ms (OK)

// Nach Optimierung
LCP Mobile: 1847ms (Gut)

// Verbesserung: -42%
```

## Troubleshooting

### Problem: Keine Daten sichtbar

**Ursache**: Noch keine Performance-Daten gesammelt

**Lösung**:
1. Öffne die Website in einem neuen Tab
2. Navigiere durch verschiedene Seiten
3. Aktualisiere das Dashboard

### Problem: Nur Mobile-Daten

**Ursache**: Nur auf mobilen Geräten getestet

**Lösung**:
1. Öffne DevTools (F12)
2. Aktiviere Device Toolbar (Ctrl+Shift+M)
3. Wechsle zwischen Mobile/Tablet/Desktop
4. Seite neu laden

### Problem: Alte Daten werden angezeigt

**Ursache**: localStorage nicht aktualisiert

**Lösung**:
1. Klicke "Aktualisieren" Button
2. Alternativ: Hard-Refresh (Ctrl+Shift+R)
3. Oder: Daten löschen und neu sammeln

### Problem: Inkonsistente Werte

**Ursache**: Netzwerk-Variabilität

**Lösung**:
1. Mehr Messungen sammeln (> 10 pro Metrik)
2. Lighthouse CI für konsistente Tests nutzen
3. Mittelwert über mehrere Sessions betrachten

## Best Practices

### 1. Regelmäßiges Monitoring

- ✅ **Täglich**: Schneller Blick auf Trends
- ✅ **Wöchentlich**: Detaillierte Analyse
- ✅ **Bei Deploys**: Vor/Nach-Vergleich

### 2. Device-spezifische Optimierung

```typescript
// Priorisierung basierend auf Traffic
if (mobileData.length > desktopData.length * 2) {
  // Focus: Mobile-First Optimierung
} else {
  // Focus: Cross-Device Optimierung
}
```

### 3. Threshold-basierte Alerts

```typescript
// Beispiel: Alert bei schlechter LCP
const avgLCP = mobileMetrics.find(m => m.name === 'LCP')?.avg;
if (avgLCP > 4000) {
  console.warn('🚨 LCP kritisch: Sofortige Optimierung erforderlich!');
}
```

### 4. Dokumentation

- 📝 Notiere Baseline-Werte vor Optimierungen
- 📝 Dokumentiere Änderungen und deren Impact
- 📝 Teile Erkenntnisse mit dem Team

## Integration mit CI/CD

### Lighthouse CI

Kombiniere mit Lighthouse CI für automatisierte Tests:

```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "settings": [
        { "preset": "desktop" },
        { "preset": "mobile" }
      ]
    },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }]
      }
    }
  }
}
```

### Performance Budgets

```json
// package.json
{
  "size-limit": [
    {
      "path": "dist/assets/*.js",
      "limit": "150 KB"
    }
  ]
}
```

## Erweiterte Analytics (Future)

### Geplante Features

- [ ] **Supabase Integration**: Persistente Speicherung in DB
- [ ] **Historische Trends**: 30-Tage-Verlauf
- [ ] **Vergleichsansicht**: Vor/Nach-Optimierung
- [ ] **Alerts**: Email-Benachrichtigungen bei Degradation
- [ ] **Export**: CSV/PDF-Export für Reports
- [ ] **Real User Monitoring**: Aggregierte User-Daten

### Edge Function für Tracking

```typescript
// supabase/functions/track-web-vitals/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { name, value, rating, device } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  await supabase.from('web_vitals').insert({
    metric_name: name,
    metric_value: value,
    rating,
    device_type: device.type,
    viewport_width: device.viewport.width,
    connection_type: device.connection?.effectiveType,
  });

  return new Response(JSON.stringify({ success: true }));
});
```

## Ressourcen

- [Web Vitals](https://web.dev/vitals/)
- [Recharts Documentation](https://recharts.org/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Zusammenfassung

Das Performance Dashboard bietet:
- ✅ Echtzeit-Visualisierung von Web Vitals
- ✅ Device-segmentierte Analyse
- ✅ Trend-Erkennung und Monitoring
- ✅ Einfache Interpretation durch Color-Coding
- ✅ Keine externe Abhängigkeit (localStorage-basiert)

**Empfehlung**: Nutze das Dashboard täglich für schnelle Performance-Checks und wöchentlich für detaillierte Analysen.
