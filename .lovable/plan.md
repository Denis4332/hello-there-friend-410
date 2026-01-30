

# UI-Lock für Kategorien (nur visuell)

## Was passiert

Rein visuelles "disabled" auf den Checkboxen - keine Logikänderung.

## Änderung

**Datei:** `src/components/profile/sections/CategoriesSection.tsx`

Statt einer gemeinsamen `renderCategory`-Funktion, separate Logik für Geschlecht und Services:

### Geschlecht-Checkboxen
```tsx
// Wenn ein Geschlecht gewählt ist, die anderen disablen
const selectedGenderId = genderCategories.find(g => selectedCategories.includes(g.id))?.id;

{genderCategories.map(cat => (
  <div key={cat.id} className="flex items-center space-x-2">
    <Checkbox
      id={`cat-${cat.id}`}
      checked={selectedCategories.includes(cat.id)}
      onCheckedChange={() => onToggle(cat.id)}
      disabled={selectedGenderId && selectedGenderId !== cat.id}
    />
    <label ...>{cat.name}</label>
  </div>
))}
```

### Service-Checkboxen
```tsx
// Zähle gewählte Services
const selectedServiceIds = serviceCategories
  .filter(s => selectedCategories.includes(s.id))
  .map(s => s.id);

{serviceCategories.map(cat => (
  <div key={cat.id} className="flex items-center space-x-2">
    <Checkbox
      id={`cat-${cat.id}`}
      checked={selectedCategories.includes(cat.id)}
      onCheckedChange={() => onToggle(cat.id)}
      disabled={selectedServiceIds.length >= 2 && !selectedServiceIds.includes(cat.id)}
    />
    <label ...>{cat.name}</label>
  </div>
))}
```

## Ergebnis

| Bereich | Verhalten |
|---------|-----------|
| Geschlecht | 1 gewählt → andere 2 ausgegraut |
| Services | 2 gewählt → restliche ausgegraut |

## Keine Änderung an

- `ProfileForm.tsx` (toggleCategory bleibt)
- Zod-Validierung (bleibt min 1, max 2)
- Filterung / Speicherung
- Datenbank

