
# Plan: Verbesserte Änderungsanfrage-Seite

## Aktuelles Problem

Die Seite `/profil/aenderung-anfragen` ist derzeit sehr primitiv:
- Nur ein Dropdown "Art der Änderung"
- Ein einfaches Textarea für "Beschreibung"  
- Nutzer müssen alles als Freitext tippen ("Ich möchte meine Stadt zu Zürich ändern...")

Das ist umständlich und fehleranfällig - ganz anders als die professionelle Profil-Erstellung.

## Lösung: Step-by-Step Formular wie bei Profil-Erstellung

Die Änderungsanfrage-Seite wird zu einem intelligenten, typenbasierten Formular umgebaut, das je nach gewähltem Änderungstyp die passenden Eingabefelder anzeigt.

### Neue UX-Struktur

```text
┌─────────────────────────────────────────────────────────────┐
│  [Zurück zum Dashboard]                                     │
│                                                             │
│  Änderung anfragen                                          │
│  ─────────────────                                          │
│                                                             │
│  Was möchtest du ändern?                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Texte]  [Standort]  [Kategorien]  [Kontakt]  [Fotos] │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─── Je nach Tab: Passende Eingabefelder ───                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tab-basierte Eingabefelder

**1. Texte ändern**
- Neuer Name (Input mit akuellem Wert)
- Neue Beschreibung (Textarea mit aktuellem Wert)
- Zusätzliche Anmerkungen (optional)

**2. Standort ändern**  
- Kanton-Dropdown (wie bei Profilerstellung)
- Stadt-Combobox mit Suche (wie bei Profilerstellung)
- GPS-Erkennung Button "Mein Standort"
- PLZ wird automatisch gesetzt
- Aktueller Standort wird als Vorauswahl geladen

**3. Kategorien ändern**
- Geschlecht-Auswahl (1 Pflicht, Radio-Style)
- Service-Auswahl (0-2 optional)
- UI-Lock für Limits (wie bei Profilerstellung)
- Aktuelle Kategorien als Vorauswahl

**4. Kontaktdaten ändern**
- Telefon, WhatsApp, E-Mail, Website, Telegram, Instagram
- Echte Input-Felder mit Validierung
- Aktuelle Werte vorgeladen

**5. Fotos ändern** (bereits implementiert)
- Bild-Upload Zone
- Preview mit Lösch-Option
- Beschreibung was geändert werden soll

### Technische Änderungen

**Datei: `src/pages/ProfileChangeRequest.tsx`**

1. **Aktuelle Profildaten laden**
   - Profil-Basisdaten (Name, Stadt, Kanton, about_me, Sprachen)
   - Kategorien aus `profile_categories`
   - Kontaktdaten aus `profile_contacts`

2. **Tab-System implementieren**
   - Radix Tabs (bereits im Projekt vorhanden)
   - 5 Tabs für die verschiedenen Änderungstypen

3. **Bestehende Komponenten wiederverwenden**
   - `LocationSection` für Standort (angepasst ohne react-hook-form)
   - `CategoriesSection` für Kategorien (angepasst)
   - Neue `ContactChangeSection` für Kontaktdaten
   - Bestehende Foto-Upload-Logik beibehalten

4. **Datenstruktur für Änderungsanfrage**
   - `request_type`: Der gewählte Tab
   - `description`: JSON-Struktur mit den strukturierten Änderungen
     ```json
     {
       "field": "city",
       "old_value": "Bern",
       "new_value": "Zürich"
     }
     ```
   - Für den Admin leicht lesbar aufbereitet

### Zusätzliche Hooks/Helfer

- `useCantons` (existiert bereits)
- `useCitiesByCantonSlim` (existiert bereits)  
- `useCategories` (existiert bereits)
- `detectLocation` aus `@/lib/geolocation` (existiert bereits)

### Vorteile dieser Lösung

1. **Konsistente UX** - Gleiche Eingabefelder wie bei Profilerstellung
2. **Weniger Fehler** - Strukturierte Eingaben statt Freitext
3. **Schnellere Admin-Bearbeitung** - Klare Änderungen statt Interpretation
4. **GPS-Erkennung** - Standort mit einem Klick aktualisieren
5. **Validierung** - Telefonnummern, E-Mails etc. werden geprüft

---

## Technische Details

### Zu erstellende/ändernde Dateien

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/pages/ProfileChangeRequest.tsx` | Komplett überarbeiten | Tab-basiertes Formular mit strukturierten Eingaben |

### Wiederverwendbare Komponenten

Die bestehenden Section-Komponenten werden für die Änderungsanfrage angepasst verwendet:
- `LocationSection` - Standort mit Kanton/Stadt/GPS
- `CategoriesSection` - Kategorien mit UI-Lock
- Neue lokale Komponenten für Text- und Kontaktänderungen

### Datenbank

Keine Schemaänderung nötig - das `description`-Feld speichert die strukturierten Daten als JSON-String.

---

## Zusammenfassung

Die Änderungsanfrage-Seite wird von einem einfachen Textarea zu einem professionellen, typenbasierten Formular umgebaut. Nutzer wählen per Tab, was sie ändern möchten, und bekommen dann die passenden Eingabefelder (Dropdowns, Comboboxen, GPS-Button etc.) - genau wie bei der Profilerstellung. Das macht die Bedienung intuitiver und die Admin-Prüfung effizienter.
