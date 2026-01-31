
# Banner System komplett entfernen

## Übersicht

Das gesamte Banner/Werbung-System wird aus dem Projekt entfernt. Dies umfasst 15 Dateien zum Löschen und 11 Dateien zum Ändern.

---

## Phase 1: Dateien löschen (15 Dateien)

### 1.1 Banner-Komponenten Ordner (8 Dateien)
```
src/components/banners/
├── BannerCTA.tsx
├── BaseBanner.tsx
├── FooterBanner.tsx
├── HeaderBanner.tsx
├── InContentBanner.tsx
├── InGridBanner.tsx
├── PopupBanner.tsx
└── index.ts
```

### 1.2 Seiten (3 Dateien)
```
src/pages/Bannerpreise.tsx
src/pages/BannerBuchen.tsx
src/pages/admin/AdminBanners.tsx
```

### 1.3 Hooks (2 Dateien)
```
src/hooks/useAdvertisements.ts
src/hooks/useAdvertisementsRealtime.ts
```

### 1.4 Types und Lib (2 Dateien)
```
src/types/advertisement.ts
src/lib/adEventQueue.ts
```

---

## Phase 2: Dateien ändern (11 Dateien)

### 2.1 src/App.tsx
**Entfernen:**
- Zeile 10: `import { PopupBanner } from "./components/banners";`
- Zeile 37-38: Lazy imports für Bannerpreise und BannerBuchen
- Zeile 62: Lazy import für AdminBanners
- Zeile 94: `<PopupBanner />`
- Zeile 112-113: Routes für /bannerpreise und /banner/buchen
- Zeile 172: Route für /admin/banners

### 2.2 src/pages/Index.tsx
**Entfernen:**
- Zeile 10: `import { HeaderBanner, FooterBanner } from '@/components/banners';`
- Zeile 76: `<HeaderBanner className="..." />`
- Zeile 101: `<FooterBanner className="..." />`

### 2.3 src/pages/Suche.tsx
**Entfernen:**
- Zeile 17: `import { HeaderBanner, InContentBanner } from '@/components/banners';`
- Zeile 295: `<HeaderBanner className="my-6" />`
- Zeile 297: `<InContentBanner className="my-6" />`

### 2.4 src/pages/Kategorie.tsx
**Entfernen:**
- Zeile 12: `import { HeaderBanner } from '@/components/banners';`
- Zeile 83: `<HeaderBanner className="mb-8" />`

### 2.5 src/pages/Stadt.tsx
**Entfernen:**
- Zeile 12: `import { HeaderBanner } from '@/components/banners';`
- Zeile 89: `<HeaderBanner className="mb-8" />`

### 2.6 src/components/search/SearchResults.tsx
**Entfernen:**
- Zeile 5: `import { InGridBanner } from '@/components/banners';`
- Zeile 25-32: Die `profileChunks` useMemo Logik
- Zeile 56-73: Die Chunk-Iteration mit Banner

**Ersetzen mit:** Einfaches Profile-Mapping ohne Chunks

### 2.7 src/components/home/FeaturedProfilesSection.tsx
**Entfernen:**
- Zeile 18: `import { InGridBanner } from '@/components/banners';`
- Zeile 48-53: Die Chunk-Logik
- Zeile 79-101: Die Chunk-Iteration mit Banner

**Ersetzen mit:** Einfaches Profile-Mapping ohne Chunks

### 2.8 src/components/layout/Header.tsx
**Entfernen:**
- Zeile 26: `const navBanners = getSetting('nav_banners', 'Werbung');`
- Zeile 67-69: Desktop Nav Link zu /bannerpreise
- Zeile 183-185: Mobile Nav Link zu /bannerpreise

### 2.9 src/components/layout/Footer.tsx
**Entfernen:**
- Zeile 26: `const linkAdvertising = getSetting('footer_link_advertising', 'Werbung schalten');`
- Zeile 50-53: Footer Link zu /bannerpreise

### 2.10 src/components/layout/AdminHeader.tsx
**Entfernen:**
- Zeile 59: `{ path: '/admin/banners', label: 'Banner' }` aus navLinks Array
- Zeile 178-186: Desktop Nav Link zu /admin/banners

### 2.11 src/pages/admin/AdminMessages.tsx
**Entfernen:**
- Zeile 77: `<TabsTrigger value="banner">Banner-Anfragen</TabsTrigger>`
- Zeile 50-52: Banner case im getTypeBadge (kann bleiben für Legacy-Daten)
- Zeile 193-194: Banner-spezifischer Leertext
- Zeile 230-263: Banner-Metadata Anzeige im Dialog (kann bleiben für Legacy)
- Zeile 293-302: "Banner erstellen" Button

---

## Phase 3: AdminPendingPayments.tsx

Diese Seite bleibt BESTEHEN, da sie auch Profil-Zahlungen verwaltet. Die Banner-Tab-Funktionalität bleibt für historische Daten erhalten, aber es werden keine neuen Banner-Zahlungen mehr angezeigt, sobald keine ausstehenden mehr vorhanden sind.

**Keine Änderungen erforderlich** - die Seite funktioniert weiterhin für:
- Profil-Zahlungen (Hauptfunktion)
- Historische Banner-Zahlungen (falls vorhanden)

---

## Zusammenfassung

| Aktion | Anzahl | Dateien |
|--------|--------|---------|
| Löschen | 15 | Banner-Komponenten, Seiten, Hooks, Types, Lib |
| Ändern | 10 | App.tsx, Index.tsx, Suche.tsx, Kategorie.tsx, Stadt.tsx, SearchResults.tsx, FeaturedProfilesSection.tsx, Header.tsx, Footer.tsx, AdminHeader.tsx |
| Behalten | 1 | AdminPendingPayments.tsx (für Profil-Zahlungen) |

---

## Nach der Entfernung

Die `advertisements` Datenbank-Tabelle bleibt bestehen (für historische Daten).
