
# Plan: Preise-Seite korrigieren

## Problem
Die Preise-Seite zeigt falsche Informationen über die Paket-Unterschiede:

| Behauptung (falsch) | Realität |
|---------------------|----------|
| "Nur TOP ADs auf Homepage" | **ALLE** Profile (TOP, Premium, Basic) sind auf Homepage |
| Homepage zeigt "TOP AD (max. 4)" | Homepage zeigt alle Profile mit Pagination |
| "Auf Homepage" nur für TOP | Alle Pakete erscheinen auf Homepage |
| "Schweizweite Sichtbarkeit" nur TOP | Alle sind schweizweit sichtbar - Unterschied ist Sortierung |

## Änderungen

### 1. VisibilityExplanation-Komponente korrigieren (Zeile 60-168)

**Visual Diagram ändern (Zeile 134-166):**

Aktuell:
```
Homepage: "TOP AD Inserate (max. 4)" - "Schweizweit für alle Besucher sichtbar"
```

Neu:
```
Homepage: Alle Pakete sichtbar
- TOP AD: Immer ganz oben
- Premium: Nach TOP ADs
- Basic: Standard-Platzierung
```

**Tier-Beschreibungen anpassen:**

| Paket | Aktuell | Neu (korrekt) |
|-------|---------|---------------|
| TOP AD | "Schweizweit auf Homepage sichtbar" | "Auf Homepage **an erster Stelle**, beste Platzierung in Suche" |
| Premium | "Im Kanton/Radius sichtbar" | "Auf Homepage nach TOP ADs, bevorzugte Platzierung in Suche" |
| Basic | "Im Kanton/Radius sichtbar" | "Auf Homepage sichtbar, Standard-Platzierung in Suche" |

### 2. Package-Features korrigieren (Zeile 306-347)

**Basic Features ändern:**
```
- 'Erscheint auf Homepage'           ← NEU
- 'Erscheint in Suchergebnissen'
- 'Standard-Platzierung'
- 'Profil-Seite'
- 'Foto-Upload'
```

**Premium Features ändern:**
```
- 'Alles von Basic +'
- 'Bessere Platzierung auf Homepage & Suche'   ← GEÄNDERT
- 'Goldener VIP Badge'
- 'Erscheint vor Basic-Inseraten'
```

**TOP AD Features ändern:**
```
- 'Alles von Premium +'
- '⭐ Immer ganz oben auf Homepage'            ← GEÄNDERT
- 'Beste Platzierung in allen Suchergebnissen'
- 'TOP AD Banner'
- 'Maximale Sichtbarkeit'
```

### 3. Feature-Vergleich-Tabelle korrigieren (Zeile 456-467)

**Zeile "Auf Homepage" ändern:**
```
Aktuell:   Basic: –  | Premium: –  | TOP: ✓
Neu:       Basic: ✓  | Premium: ✓  | TOP: ✓
```

**Zeile "Schweizweite Sichtbarkeit" ändern oder entfernen:**
- Option A: Alle auf ✓ setzen (weil alle auf Homepage sichtbar sind)
- Option B: Zeile umbenennen zu "Beste Platzierung" (nur TOP ✓)

**Empfehlung:** Zeile umbenennen zu "Top-Platzierung garantiert" → nur TOP ✓

### 4. Zusammenfassung der geänderten Zeilen

| Zeile | Datei | Änderung |
|-------|-------|----------|
| 72-96 | Preise.tsx | Tier-Beschreibungstexte anpassen |
| 134-166 | Preise.tsx | Visual Diagram korrigieren |
| 306-312 | Preise.tsx | Basic Features aktualisieren |
| 323-329 | Preise.tsx | Premium Features aktualisieren |
| 339-346 | Preise.tsx | TOP AD Features aktualisieren |
| 456-467 | Preise.tsx | Feature-Vergleich-Tabelle korrigieren |

---

## Technische Details

Alle Änderungen betreffen **nur hardcodierte Texte** in `src/pages/Preise.tsx`. Die CMS-Einstellungen (getSetting) werden weiterhin respektiert - falls im CMS korrekte Werte hinterlegt sind, werden diese angezeigt.

**Wichtig:** Die Default-Werte (Fallbacks) werden korrigiert, sodass ohne CMS-Einstellungen trotzdem korrekte Informationen angezeigt werden.

---

## Erwartetes Ergebnis

Nach der Korrektur:
- ✅ Alle Pakete zeigen "Auf Homepage" als Feature
- ✅ Der Unterschied (Platzierung) ist klar kommuniziert
- ✅ Keine irreführenden Aussagen mehr
- ✅ Tabelle zeigt korrekt an, dass alle auf Homepage sind
- ✅ TOP AD Vorteil = "Immer ganz oben" statt "Exklusiver Homepage-Zugang"
