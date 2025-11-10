# Mobile Performance Monitoring

## Übersicht

Das Projekt verfügt über ein umfassendes Mobile-Performance-Monitoring-System mit:
- **Device-Type-Detection** (Mobile/Tablet/Desktop)
- **Separate Tracking** für verschiedene Gerätetypen
- **Connection Information** (Netzwerkqualität, Latenz)
- **Lighthouse CI** für automatisierte Mobile/Desktop-Tests

## Web Vitals Tracking

### Automatisches Tracking

Web Vitals werden automatisch beim Seitenaufruf getrackt:
- **CLS** (Cumulative Layout Shift) - Ziel: < 0.1
- **INP** (Interaction to Next Paint) - Ziel: < 100ms
- **FCP** (First Contentful Paint) - Ziel: < 2.0s
- **LCP** (Largest Contentful Paint) - Ziel: < 2.5s
- **TTFB** (Time to First Byte) - Ziel: < 800ms

### Device-Segmentierung

Die Metriken werden automatisch nach Gerätetyp segmentiert:
- **Mobile**: < 768px Viewport-Breite
- **Tablet**: 768px - 1024px Viewport-Breite
- **Desktop**: > 1024px Viewport-Breite

### Gespeicherte Daten abrufen

```javascript
import { getWebVitalsData, clearWebVitalsData } from '@/utils/webVitals';

// Mobile-Daten abrufen
const mobileMetrics = getWebVitalsData('mobile');
console.log('Mobile Web Vitals:', mobileMetrics);

// Desktop-Daten abrufen
const desktopMetrics = getWebVitalsData('desktop');
console.log('Desktop Web Vitals:', desktopMetrics);

// Tablet-Daten abrufen
const tabletMetrics = getWebVitalsData('tablet');
console.log('Tablet Web Vitals:', tabletMetrics);

// Alle Daten löschen
clearWebVitalsData();
```

### Console-Logging (Development)

Im Development-Modus werden alle Metriken in der Console geloggt:

```
[Web Vitals - MOBILE] LCP: 1847.3 {
  viewport: '375x667',
  connection: '4g',
  rating: 'good'
}
```

## Lighthouse CI

### Automatisierte Tests

Lighthouse CI läuft automatisch bei jedem Push und testet:
- **Desktop-Performance** (schnelle Verbindung)
- **Mobile-Performance** (3G-Throttling, CPU 4x langsamer)

### Test-URLs

Folgende Seiten werden getestet:
- Homepage: `/`
- Suche: `/suche`
- Kategorien: `/kategorien`
- Profil: `/profil/test-profile`

### Performance-Ziele

| Metrik | Ziel | Severity |
|--------|------|----------|
| Performance Score | ≥ 90% | Error |
| Accessibility Score | ≥ 95% | Error |
| Best Practices Score | ≥ 95% | Error |
| SEO Score | ≥ 95% | Error |
| First Contentful Paint | < 2.0s | Warning |
| Largest Contentful Paint | < 2.5s | Warning |
| Cumulative Layout Shift | < 0.1 | Error |
| Total Blocking Time | < 300ms | Warning |
| Interactive | < 3.5s | Warning |
| Speed Index | < 3.0s | Warning |
| Max Potential FID | < 130ms | Warning |

### Lighthouse CI lokal ausführen

```bash
# Installation (einmalig)
npm install -g @lhci/cli

# Build erstellen
npm run build

# Lighthouse CI ausführen
lhci autorun
```

## Connection Information

Das System erfasst automatisch Netzwerk-Informationen (wenn verfügbar):
- **effectiveType**: 'slow-2g' | '2g' | '3g' | '4g'
- **downlink**: Download-Geschwindigkeit in Mbps
- **rtt**: Round-Trip-Time in Millisekunden

Diese Daten helfen zu verstehen, wie Performance mit der Netzwerkqualität korreliert.

## Integration mit Analytics

### Production-Tracking

Um die Metriken in Production zu tracken, entkommentieren Sie in `src/utils/webVitals.ts`:

```typescript
// In production, send to analytics with device segmentation
fetch('/api/track-web-vitals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(enhancedMetric),
});
```

### Supabase Edge Function

Beispiel für eine Supabase Edge Function (`track-web-vitals`):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const metric = await req.json();

  await supabase.from('web_vitals').insert({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    device_type: metric.device.type,
    viewport_width: metric.device.viewport.width,
    viewport_height: metric.device.viewport.height,
    connection_type: metric.device.connection?.effectiveType,
    timestamp: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Monitoring-Dashboard (Optional)

Sie können ein Dashboard erstellen, um die Performance-Daten zu visualisieren:

```typescript
import { getWebVitalsData } from '@/utils/webVitals';

const PerformanceDashboard = () => {
  const mobileMetrics = getWebVitalsData('mobile');
  const desktopMetrics = getWebVitalsData('desktop');

  return (
    <div>
      <h2>Mobile Performance</h2>
      <MetricsChart data={mobileMetrics} />
      
      <h2>Desktop Performance</h2>
      <MetricsChart data={desktopMetrics} />
    </div>
  );
};
```

## Best Practices

1. **Mobile First**: Optimieren Sie zuerst für Mobile-Performance
2. **Regular Monitoring**: Überprüfen Sie Web Vitals regelmäßig
3. **Network Awareness**: Berücksichtigen Sie unterschiedliche Netzwerkqualitäten
4. **Device Segmentation**: Vergleichen Sie Metriken nach Gerätetyp
5. **Continuous Testing**: Nutzen Sie Lighthouse CI bei jedem Deployment

## Nächste Schritte

- [ ] Supabase Edge Function für Production-Tracking erstellen
- [ ] Performance-Dashboard im Admin-Bereich implementieren
- [ ] Alerts für schlechte Performance-Werte einrichten
- [ ] A/B-Testing für Performance-Optimierungen durchführen
