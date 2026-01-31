
# Banner System v2.0 - Komplettes Upgrade

## Übersicht

Dieses Upgrade transformiert das bestehende Banner-System zu einem professionellen Werbesystem mit:
- **5 Positionen** statt 3 (header_banner, in_content, in_grid, footer_banner, popup)
- **IAB Standard-Grössen** mit korrektem Cropping
- **Faire Rotation** mit Priority-basierter gewichteter Auswahl
- **Feste Slot-Limits** pro Position (z.B. max. 3 Header-Banner, max. 5 In-Grid-Banner)
- **Neues Admin-Dashboard** mit Übersicht, Tabs und Slot-Verfügbarkeit

## Phasen-Übersicht

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    BANNER SYSTEM v2.0 UPGRADE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PHASE 1: Dateien löschen (7 Komponenten)                           │
│     ↓                                                                │
│  PHASE 2: Datenbank-Migration (Positionen + Priority-Default)       │
│     ↓                                                                │
│  PHASE 3: Types aktualisieren (BannerPosition + BANNER_CONFIG)      │
│     ↓                                                                │
│  PHASE 4: Hooks erweitern (Rotation, Slot-Counts, neue API)         │
│     ↓                                                                │
│  PHASE 5: Neue Banner-Komponenten (5 + Index)                       │
│     ↓                                                                │
│  PHASE 6: Neues Admin-Dashboard (AdminBanners.tsx)                  │
│     ↓                                                                │
│  PHASE 7: Seiten aktualisieren (Index, Suche, App.tsx, Routes)      │
│     ↓                                                                │
│  PHASE 8: BannerBuchen.tsx mit neuer Config                         │
│     ↓                                                                │
│  PHASE 9: Bannerpreise.tsx dynamisch generieren                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Dateien löschen

Diese Dateien werden komplett gelöscht und durch neue ersetzt:

| Datei | Grund |
|-------|-------|
| `src/components/BannerDisplay.tsx` | Neu als separate Komponenten |
| `src/components/PopupBanner.tsx` | Neue Version mit Cooldown-Logik integriert |
| `src/components/BannerManager.tsx` | Nicht mehr benötigt |
| `src/components/DemoPopupBanner.tsx` | Entfernt |
| `src/components/AdvertisementCTA.tsx` | Neu mit allen 5 Positionen |
| `src/components/admin/ImageCropper.tsx` | In Admin-Dashboard integriert |
| `src/pages/admin/AdminAdvertisements.tsx` | Ersetzt durch AdminBanners.tsx |

**BEHALTEN:**
- `src/lib/adEventQueue.ts` - Bestehendes Tracking-System bleibt unverändert
- `src/hooks/useAdvertisementsRealtime.ts` - Bleibt

---

## Phase 2: Datenbank-Migration

```sql
-- Alte Positionen zu neuen migrieren
ALTER TABLE advertisements 
  DROP CONSTRAINT IF EXISTS advertisements_position_check;

ALTER TABLE advertisements 
  ADD CONSTRAINT advertisements_position_check 
  CHECK (position IN (
    'header_banner',
    'in_content', 
    'in_grid',
    'footer_banner',
    'popup'
  ));

-- Bestehende Daten migrieren
UPDATE advertisements SET position = 'header_banner' WHERE position = 'top';
UPDATE advertisements SET position = 'in_grid' WHERE position = 'grid';
-- 'popup' bleibt 'popup'

-- Priority Default
ALTER TABLE advertisements 
  ALTER COLUMN priority SET DEFAULT 50;

UPDATE advertisements SET priority = 50 WHERE priority IS NULL OR priority = 0;
```

---

## Phase 3: Types aktualisieren

**Datei:** `src/types/advertisement.ts`

Neue Struktur:

```typescript
export type BannerPosition = 
  | 'header_banner'
  | 'in_content'
  | 'in_grid'
  | 'footer_banner'
  | 'popup';

export const BANNER_CONFIG: Record<BannerPosition, {
  name: string;
  desktop: { width: number; height: number };
  mobile: { width: number; height: number };
  maxSlots: number;
  pricePerDay: number;
  pricePerWeek: number;
  pricePerMonth: number;
  aspectRatio: number;
}> = {
  header_banner: {
    name: 'Header Banner',
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 100 },
    maxSlots: 3,
    pricePerDay: 60,
    pricePerWeek: 380,
    pricePerMonth: 1400,
    aspectRatio: 728 / 90,
  },
  // ... weitere Positionen
};
```

---

## Phase 4: Hooks erweitern

**Datei:** `src/hooks/useAdvertisements.ts`

Neue Funktionen:

| Hook | Funktion |
|------|----------|
| `selectWeightedRandom()` | Gewichtete Zufallsauswahl basierend auf Priority |
| `useAdvertisement(position)` | Gibt EINEN rotierenden Banner zurück |
| `useBannerSlotCounts()` | Zählt aktive Banner pro Position |
| `useAllActiveAdvertisements()` | Cached Query für alle aktiven Banner |

Die gewichtete Rotation funktioniert so:
1. Alle Banner für Position laden
2. Jeder Banner hat eine Priority (1-100, Default: 50)
3. Höhere Priority = höhere Chance gewählt zu werden
4. Bei gleicher Priority: faire Verteilung

---

## Phase 5: Neue Banner-Komponenten

Erstelle Ordner `src/components/banners/` mit:

| Komponente | Position | Desktop-Grösse | Mobile-Grösse |
|------------|----------|----------------|---------------|
| `HeaderBanner.tsx` | header_banner | 728×90 | 320×100 |
| `InContentBanner.tsx` | in_content | 728×90 | 320×100 |
| `InGridBanner.tsx` | in_grid | 300×400 | 300×400 |
| `FooterBanner.tsx` | footer_banner | 728×90 | 320×100 |
| `PopupBanner.tsx` | popup | 300×400 | 300×400 |
| `index.ts` | Export-Datei | - | - |

Jede Komponente:
- Nutzt `useAdvertisement(position)` für Rotation
- Tracked Impressions nach 2s Delay via `queueAdEvent()`
- Tracked Clicks beim Öffnen des Links
- Responsives Design mit `hidden md:block` / `md:hidden`

---

## Phase 6: Neues Admin-Dashboard

**Neue Datei:** `src/pages/admin/AdminBanners.tsx`

Features:
- **Slot-Übersicht Cards**: Zeigt für jede Position verwendet/maximal (z.B. "2/3")
- **Tabs nach Position**: Alle, Header, In-Content, In-Grid, Footer, Popup
- **Integrierter Cropper**: Schneidet Bilder automatisch auf Position-Grösse zu
- **Priority-Slider**: 1-100 für Rotations-Gewichtung
- **Position Info-Box**: Zeigt Pixelgrössen und Preise
- **Slot-Warnung**: Blockiert Erstellung wenn Position voll

---

## Phase 7: Seiten aktualisieren

### Index.tsx
- `<BannerDisplay position="top" />` → `<HeaderBanner />`
- Vor Footer: `<FooterBanner />`
- Am Ende: `<PopupBanner />`

### Suche.tsx
- Header: `<HeaderBanner />`
- Nach jedem 6. Profil im Grid: `<InGridBanner />`
- Zwischen Suchfiltern und Ergebnissen: `<InContentBanner />`
- Footer: `<FooterBanner />`

### App.tsx
- Entferne `BannerManager` Import
- Route `/admin/advertisements` → `/admin/banners`

### AdminHeader.tsx
- Link zu `/admin/banners` aktualisieren

---

## Phase 8 & 9: BannerBuchen & Bannerpreise

Beide Seiten werden aktualisiert um:
- `BANNER_CONFIG` zu importieren und dynamisch zu rendern
- Slot-Verfügbarkeit anzuzeigen
- Korrekte Pixelgrössen für Desktop UND Mobile zu zeigen
- Preise aus Config zu nehmen

---

## Preisübersicht nach dem Upgrade

| Position | Desktop | Mobile | Slots | CHF/Tag | CHF/Woche | CHF/Monat |
|----------|---------|--------|-------|---------|-----------|-----------|
| Header Banner | 728×90 | 320×100 | 3 | 60 | 380 | 1'400 |
| In-Content | 728×90 | 320×100 | 5 | 35 | 220 | 800 |
| In-Grid | 300×400 | 300×400 | 5 | 30 | 190 | 700 |
| Footer Banner | 728×90 | 320×100 | 3 | 25 | 160 | 600 |
| Popup | 300×400 | 300×400 | 2 | 80 | 500 | 1'800 |

---

## Dateiänderungen Zusammenfassung

| Aktion | Dateien |
|--------|---------|
| **LÖSCHEN** | 7 Dateien (BannerDisplay, PopupBanner, BannerManager, DemoPopupBanner, AdvertisementCTA, ImageCropper, AdminAdvertisements) |
| **NEU ERSTELLEN** | 7 Dateien (HeaderBanner, InContentBanner, InGridBanner, FooterBanner, PopupBanner, index.ts, AdminBanners.tsx) |
| **AKTUALISIEREN** | 6 Dateien (advertisement.ts, useAdvertisements.ts, Index.tsx, Suche.tsx, App.tsx, AdminHeader.tsx) |
| **OPTIONAL** | 2 Dateien (BannerBuchen.tsx, Bannerpreise.tsx) |
| **MIGRATION** | 1 SQL-Migration für Datenbank |

---

## Was unverändert bleibt

- `src/lib/adEventQueue.ts` - Bestehendes Tracking-System
- `src/hooks/useAdvertisementsRealtime.ts` - Realtime-Listener
- Profil-Komponenten, Auth, Suche-Logik - Nur Banner-Integration
- 3-Sekunden Impression-Timer (jetzt 2 Sekunden gemäss Dokument)

---

## Testing nach Deployment

1. **Alle 5 Positionen** auf Desktop UND Mobile prüfen
2. **Rotation testen**: 2+ Banner für gleiche Position erstellen → wechseln sie?
3. **Slot-Limits**: Versuchen mehr als erlaubt zu erstellen → wird blockiert?
4. **Cropper**: Verschiedene Bildgrössen hochladen → korrekt zugeschnitten?
5. **Tracking**: Klicks und Impressions werden gezählt?
6. **Admin Dashboard**: Alle Tabs, Filter, CRUD funktionieren?
