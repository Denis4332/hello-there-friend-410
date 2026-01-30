

# Mini UI-Fixes

## Änderung 1: Geschlecht-Dropdown entfernen

**Datei:** `src/components/profile/sections/BasicInfoSection.tsx`

Zeilen 46-60 löschen (das komplette Geschlecht-Select). User wählt Geschlecht jetzt über die Kategorien (Damen/Männer/Trans).

**Vorher:**
- Anzeigename
- Volljährigkeits-Checkbox
- Geschlecht-Dropdown ← WEG

**Nachher:**
- Anzeigename
- Volljährigkeits-Checkbox

---

## Änderung 2: Checkbox-Text erweitern

**Datei:** `src/components/profile/sections/BasicInfoSection.tsx`

Zeile 38 ändern:

**Von:**
```
Ich bestätige, dass ich volljährig bin (18+) *
```

**Zu:**
```
Ich bestätige, dass ich volljährig bin (18+) und akzeptiere die AGB *
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `BasicInfoSection.tsx` | Geschlecht-Dropdown raus + Checkbox-Text erweitern |

## Keine Änderung an

- Validierung / Logik
- CategoriesSection
- ProfileForm
- Datenbank

