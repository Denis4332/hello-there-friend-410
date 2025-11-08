# Accessibility (A11y) Guidelines

## Übersicht

Diese Anwendung wurde mit Web Content Accessibility Guidelines (WCAG 2.1) Level AA im Fokus entwickelt.

## Implementierte Features

### 1. ARIA-Labels
- **Navigation**: Alle Navigationslinks und Buttons haben aussagekräftige `aria-label` Attribute
- **Buttons**: Icon-only Buttons enthalten `aria-label` für Screen Reader
- **Forms**: Alle Formularelemente haben passende Labels und `aria-label` Attribute
- **Interactive Elements**: Dropdown-Menüs verwenden `aria-haspopup`, `aria-expanded`, `role="listbox"` und `role="option"`

### 2. Keyboard Navigation
- **Tab-Reihenfolge**: Alle interaktiven Elemente sind in logischer Reihenfolge navigierbar
- **Focus States**: Sichtbare Focus-Indikatoren für alle interaktiven Elemente (`focus-visible:ring-2`)
- **Skip Links**: Semantic HTML sorgt für gute Keyboard-Navigation
- **Shortcut-Support**: Keine Keyboard-Traps, ESC schließt Dialoge und Menüs

### 3. Screen Reader Support
- **Semantic HTML**: `<header>`, `<nav>`, `<main>`, `<section>`, `<form>` für Struktur
- **ARIA Roles**: `role="banner"`, `role="navigation"`, `role="search"`, `role="listbox"` für Regionen
- **Hidden Icons**: Icons haben `aria-hidden="true"`, Text ist über `sr-only` verfügbar
- **Live Regions**: Wichtige Updates werden über Toast-Benachrichtigungen kommuniziert
- **Descriptive Labels**: Alle Slider haben `aria-label` mit aktuellem Wert

### 4. Color Contrast
- **WCAG AA Konformität**: Mindestens 4.5:1 Kontrastverhältnis für Text
- **Verbesserte Farben**:
  - Light Mode: `--muted-foreground: 0 0% 40%` (vorher 45%)
  - Dark Mode: `--muted-foreground: 0 0% 70%` (vorher 65%)
- **Fokus-Indikatoren**: Deutlich sichtbar mit `ring-offset-2`
- **Link-Hover**: Unterstrichen bei Hover für bessere Erkennbarkeit

### 5. Form Accessibility
- **Label Association**: Alle Inputs haben zugehörige `<label>` oder `aria-label`
- **Error Messages**: Fehler werden über `aria-describedby` mit Inputs verknüpft
- **Required Fields**: Pflichtfelder sind klar gekennzeichnet
- **Validation**: Inline-Validierung mit aussagekräftigen Fehlermeldungen

## Komponenten-spezifische Features

### Header
- `role="banner"` für Hauptkopfzeile
- `aria-label="Hauptnavigation"` für Desktop-Navigation
- `aria-label="Mobile Navigation"` für Mobile-Menü
- Icon-Buttons haben `sr-only` Text für Screen Reader

### SearchFilters
- `role="search"` für Suchformular
- Slider haben `aria-label` mit aktuellem Wert
- Filter-Heading mit `id` für `aria-labelledby` Referenzen
- Alle Buttons haben beschreibende `aria-label` Attribute

### FilterPopover
- `role="listbox"` für Dropdown-Optionen
- `role="option"` mit `aria-selected` für einzelne Optionen
- `aria-haspopup="listbox"` für Trigger-Button
- `aria-expanded` zeigt offenen/geschlossenen Zustand

## Testing

### Empfohlene Tools
- **axe DevTools**: Browser-Extension für automatische Accessibility-Tests
- **NVDA/JAWS**: Screen Reader Testing auf Windows
- **VoiceOver**: Screen Reader Testing auf macOS/iOS
- **Keyboard**: Tab-Navigation ohne Maus testen
- **Lighthouse**: Accessibility-Score in Chrome DevTools

### Manual Testing Checklist
- [ ] Alle Seiten mit Tastatur navigierbar
- [ ] Focus-Indikatoren sichtbar und deutlich
- [ ] Screen Reader liest alle Inhalte korrekt vor
- [ ] Formulare können vollständig per Tastatur ausgefüllt werden
- [ ] Farbkontrast erfüllt WCAG AA Standard
- [ ] Vergrößerung auf 200% funktioniert ohne Datenverlust
- [ ] Keine Keyboard-Traps

## Bekannte Einschränkungen
- Bildergalerien könnten zusätzliche Beschreibungen benötigen
- Komplexe Datentabellen könnten verbesserte ARIA-Unterstützung brauchen

## Verbesserungsvorschläge
1. Skip-to-content Link für Direktzugriff auf Hauptinhalt
2. ARIA Live Regions für dynamische Inhaltsänderungen
3. Zusätzliche Tastaturbefehle für häufige Aktionen
4. Beschreibende `aria-describedby` für komplexe Formularfelder
5. Verbesserte Fehlermeldungen mit Korrekturhinweisen

## Ressourcen
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [a11y Project Checklist](https://www.a11yproject.com/checklist/)
