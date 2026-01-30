
# Zwei Bestätigungen zusammenführen

## Problem
Aktuell gibt es zwei separate Checkboxen:
1. **In ProfileCreate.tsx** (oben, vor dem Formular): "Ich akzeptiere die Inserat-AGB"
2. **In BasicInfoSection.tsx** (im Formular): "Ich bestätige, dass ich volljährig bin (18+) und akzeptiere die AGB"

Das ist doppelt und verwirrend.

---

## Lösung

Alles in **eine Checkbox** im Formular kombinieren und die separate Checkbox in ProfileCreate.tsx entfernen.

---

## Änderung 1: ProfileCreate.tsx - Separate AGB-Checkbox entfernen

**Datei:** `src/pages/ProfileCreate.tsx`

**Zeilen 390-418 löschen** (der komplette AGB-Block vor dem ProfileForm):
```tsx
{/* AGB Checkbox for Profile Creation */}
<div className="mb-6 p-4 bg-muted/50 rounded-lg border">
  ...
</div>
```

**agbAccepted State** und die Validierung in `handleFormSubmit` anpassen - `is_adult` im Formular übernimmt alles.

---

## Änderung 2: BasicInfoSection.tsx - Kombinierte Checkbox

**Datei:** `src/components/profile/sections/BasicInfoSection.tsx`

**Zeile 37-38** - Der Text wird erweitert:

**Von:**
```
Ich bestätige, dass ich volljährig bin (18+) und akzeptiere die AGB *
```

**Zu:**
```
Ich bestätige, dass ich volljährig (18+) bin und akzeptiere die AGB und Datenschutzbestimmungen für Inserate *
```

Zusätzlich einen Hinweistext mit Links hinzufügen:
```tsx
<p className="text-xs text-muted-foreground mt-1">
  Lies unsere <Link to="/agb">AGB</Link> und <Link to="/datenschutz">Datenschutzbestimmungen</Link>
</p>
```

---

## Änderung 3: ProfileCreate.tsx - agbAccepted State entfernen

Da `is_adult` jetzt alles abdeckt:
- `agbAccepted` State entfernen (Zeile 30)
- Prüfung in `handleFormSubmit` anpassen (Zeilen 113-121)
- `disabled={isSubmitting || !agbAccepted}` ändern zu `disabled={isSubmitting}`

---

## Kategorien-Text

Der aktuelle Text "max. 2" bei Services ist **korrekt** - Services sind optional (0-2).
Der Text "Wähle dein Geschlecht und optional einen Service (max. 2)" beschreibt das richtig.

Falls gewünscht, kann ich den Text klarer machen:
- **Vorher:** "Wähle dein Geschlecht und optional einen Service (max. 2)"
- **Nachher:** "Wähle dein Geschlecht (Pflicht) und bis zu 2 Services (optional)"

---

## Zusammenfassung

| Datei | Änderung |
|-------|----------|
| `ProfileCreate.tsx` | AGB-Checkbox Block entfernen, agbAccepted State entfernen |
| `BasicInfoSection.tsx` | Checkbox-Text erweitern + Links zu AGB/Datenschutz |
| `CategoriesSection.tsx` | Text optional klarer machen |

## Ergebnis

Nur noch **eine Checkbox** die alles abdeckt:
- ✅ Volljährigkeit
- ✅ AGB-Akzeptanz  
- ✅ Datenschutzbestimmungen
