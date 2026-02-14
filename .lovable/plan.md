

# Paketwechsel-Logik vereinfachen

## Regeln

1. **Unbezahlt (payment_status = 'pending')**: Paketwechsel frei moeglich (up + down), aber Medien-Limits werden geprueft (Exploit-Schutz existiert bereits in ProfileCreate.tsx via `validateMediaForNewPackage`)
2. **Aktiv + Bezahlt**: NUR Verlaengerung (gleiches Paket, +30 Tage). Kein Upgrade, kein Downgrade
3. **Inaktiv/Abgelaufen**: Freie Paketwahl (alle 3 Pakete), voller Preis. Medien-Limits werden geprueft
4. **Profil-ID bleibt IMMER gleich** -- kein Neuerstellen noetig

## Aenderungen

### 1. UserDashboard.tsx

**Entfernen (Zeilen 475-484):**
- Der "Paket upgraden" Button fuer aktive+bezahlte Profile wird komplett entfernt

**Aendern (Zeilen 486-495):**
- "Inserat verlaengern" Button wird fuer ALLE aktiven+bezahlten Profile angezeigt (nicht nur TOP)

**Aendern (Zeilen 497-503):**
- Downgrade-Text ersetzen durch: "Nach Ablauf am XX.XX.XXXX kannst du ein anderes Paket waehlen"
- Gilt fuer alle aktiven bezahlten Profile (nicht nur premium/top)

**Beibehalten:**
- "Paket aendern" Button bei unbezahlten Profilen (Zeile 465-473) -- navigiert zu `/profil/erstellen?step=listing-type` wo Medien-Validierung greift
- "Reaktivieren" Button bei inaktiven Profilen (Zeile 506-513)

### 2. ProfileUpgrade.tsx

**Aktive Profile:**
- `PACKAGE_RANK` und `isUpgrade` Logik entfernen (Zeilen 15-20)
- Keine Paketauswahl-Karten anzeigen
- Nur den Verlaengerungsbereich mit "Verlaengern +30 Tage" Button anzeigen
- Titel: "Inserat verlaengern"

**Inaktive Profile:**
- Alle 3 Pakete anzeigen (freie Wahl)
- `availablePackages` wird immer `allPackages` sein (kein Filter mehr)
- Titel: "Paket waehlen"
- Medien-Validierung hinzufuegen in `handleUpgrade`: Vor dem Oeffnen des Payment-Modals die aktuelle Medien-Anzahl gegen die Limits des gewaehlten Pakets pruefen (gleiche Logik wie `validateMediaForNewPackage` in ProfileCreate.tsx)

### 3. Exploit-Schutz (Medien-Limits)

Bereits vorhanden fuer unbezahlte Profile in `ProfileCreate.tsx`:
- `validateMediaForNewPackage` prueft Foto- und Video-Anzahl gegen Paket-Limits
- Blockiert den Wechsel wenn zu viele Medien vorhanden sind

Neu hinzufuegen in `ProfileUpgrade.tsx` fuer inaktive Profile:
- Gleiche Validierung vor Paketzahlung
- Nutzer muss erst ueberzaehlige Medien loeschen bevor er ein kleineres Paket waehlen kann

```text
Medien-Limits:
  Basic:   5 Fotos, 0 Videos
  Premium: 10 Fotos, 1 Video
  TOP:     15 Fotos, 2 Videos
```

## Zusammenfassung der Flows

```text
Unbezahltes Profil (Dashboard):
  [Paket aendern] -> /profil/erstellen?step=listing-type
  Medien-Validierung greift automatisch

Aktives + Bezahltes Profil (Dashboard):
  [Inserat verlaengern] -> /user/upgrade (nur Verlaengerung)
  "Nach Ablauf am XX.XX.XXXX kannst du ein anderes Paket waehlen"

Inaktives Profil (Dashboard):
  [Inserat reaktivieren] -> /user/upgrade (alle 3 Pakete)
  Medien-Validierung vor Zahlung
```
