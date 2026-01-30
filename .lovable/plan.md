
# Mini-Fix: Geschlecht-Filterung korrigieren

## Problem
Die aktuelle Filterung matched zu viele Kategorien als "Geschlecht":
- "MILF & Reife Damen" wird als Geschlecht erkannt (wegen "Damen")
- "Gay & Männer" wird als Geschlecht erkannt (wegen "Männer")

## Lösung
Nur die **exakten 3 Slugs** matchen statt Teilstring-Suche.

## Änderung

**Datei:** `src/components/profile/sections/CategoriesSection.tsx`

**Zeile 14 ändern von:**
```tsx
const GENDER_SLUGS = ['damen', 'maenner', 'manner', 'transsexuelle-ts', 'trans', 'transsexuelle'];
```

**Zu:**
```tsx
const GENDER_SLUGS = ['damen', 'maenner', 'transsexuelle'];
```

**Zeile 18-20 ändern von:**
```tsx
const genderCategories = categories.filter(cat => 
  GENDER_SLUGS.some(slug => cat.slug.toLowerCase().includes(slug) || cat.name.toLowerCase().includes('dame') || cat.name.toLowerCase().includes('männer') || cat.name.toLowerCase().includes('trans'))
);
```

**Zu:**
```tsx
const genderCategories = categories.filter(cat => 
  GENDER_SLUGS.includes(cat.slug)
);
```

## Ergebnis

**Geschlecht (oben):**
- Damen
- Männer
- Transsexuelle & TS

**Service / Angebot (unten):**
- Paare & Swinger
- Domina & BDSM
- Begleitung
- Erotische Massagen
- MILF & Reife Damen
- Gay & Männer
- Webcam & Online

## Keine Änderung an
- Validierung (bleibt: min 1, max 2)
- Logik
- Speicherung
- Admin-Formular
