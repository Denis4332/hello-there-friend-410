# 🧪 Manueller Test-Checklist

> **Vor Saferpay-Integration durchzuführen**  
> Stand: 2025-11-27

---

## 📊 Test-Daten Status

| Bereich | Anzahl | Status |
|---------|--------|--------|
| Test-Profile | 23 | ✅ Vorhanden |
| TOP Ads | 10 | ✅ |
| Premium Ads | 5 | ✅ |
| Basic Ads | 8 | ✅ |
| Kategorien | 10 | ✅ |
| Fotos | 0 | ⚠️ Hochladen |
| Banner | 0 | ⚠️ Erstellen |
| CMS Settings | 328 | ✅ |

---

## I. 🔐 Authentifizierung & Benutzer

### 1.1 Registrierung
- [ ] Neuen Account erstellen mit gültiger E-Mail
- [ ] Bestätigung: Kein automatisches Profil erstellt (Account ≠ Profil)
- [ ] Validierung: Ungültige E-Mail wird abgelehnt
- [ ] Validierung: Zu kurzes Passwort wird abgelehnt
- [ ] Toast-Nachricht erscheint (CMS-gesteuert)

### 1.2 E-Mail-Bestätigung (Anti-Fake)
- [ ] Bestätigungs-E-Mail wird gesendet nach Registrierung
- [ ] Link in E-Mail funktioniert
- [ ] Account erst nach Bestätigung aktiv
- [ ] Erneut senden Button funktioniert
- [ ] Unbestätigte Accounts können sich nicht einloggen

### 1.2 Login
- [ ] Erfolgreicher Login mit korrekten Daten
- [ ] Fehlgeschlagener Login mit falschen Daten
- [ ] Rate-Limiting: Nach 5 Fehlversuchen → 15 Min Sperre
- [ ] Gesperrter Account kann sich nicht einloggen
- [ ] Toast-Nachrichten korrekt (Erfolg/Fehler)

### 1.3 Passwort zurücksetzen
- [ ] "Passwort vergessen" Link funktioniert
- [ ] E-Mail wird gesendet
- [ ] Reset-Link funktioniert
- [ ] Neues Passwort kann gesetzt werden

### 1.4 Logout
- [ ] Logout funktioniert
- [ ] Session wird beendet
- [ ] Weiterleitung zur Startseite

---

## II. 📝 Inserat/Profil erstellen

### 2.1 Profil-Erstellung (Multi-Step)
- [ ] Step 1: Basis-Infos eingeben
  - [ ] Display Name (Pflicht)
  - [ ] Alter (Pflicht, 18+)
  - [ ] Geschlecht auswählen
  - [ ] Sprachen auswählen
  - [ ] Über mich Text
  - [ ] Altersbestätigung (Pflicht-Checkbox)

### 2.2 Kategorien
- [ ] Kategorien werden angezeigt (10 aktive)
- [ ] Max. 2 Kategorien wählbar
- [ ] Fehler-Toast bei 3. Kategorie-Versuch
- [ ] Mindestens 1 Kategorie erforderlich

### 2.3 Standort
- [ ] Kanton auswählen (Pflicht)
- [ ] Stadt eingeben (Pflicht)
- [ ] PLZ eingeben (optional)
- [ ] GPS-Koordinaten werden automatisch gesetzt (Trigger)

### 2.4 Kontaktdaten
- [ ] E-Mail eingeben
- [ ] Telefon eingeben
- [ ] WhatsApp eingeben
- [ ] Website eingeben
- [ ] Instagram eingeben
- [ ] Telegram eingeben
- [ ] Strasse eingeben (optional)
- [ ] "Strasse anzeigen" Toggle

### 2.5 Foto-Upload
- [ ] Foto hochladen (JPG/PNG/WebP)
- [ ] Max. 5 MB pro Bild
- [ ] Ungültiges Format wird abgelehnt
- [ ] Primär-Foto setzen
- [ ] Foto löschen
- [ ] Mehrere Fotos hochladen

### 2.6 Listing-Typ Auswahl
- [ ] Basic (Gratis) wählbar
- [ ] Premium wählbar
- [ ] TOP wählbar
- [ ] Preise werden angezeigt
- [ ] Dauer-Optionen (7/30/90 Tage)

### 2.7 Verifizierung (Optional)
- [ ] Verifizierungs-Dokument hochladen
- [ ] Upload erfolgreich
- [ ] Status "pending" nach Upload
- [ ] Überspringen möglich

---

## III. 🔍 Suche & Filter

### 3.1 Text-Suche
- [ ] Suche nach Display-Name
- [ ] Suche nach Stadt
- [ ] Suche nach Keywords
- [ ] Leere Suche zeigt alle

### 3.2 Kategorie-Filter
- [ ] Filter nach einzelner Kategorie
- [ ] Filter zeigt korrekte Ergebnisse
- [ ] Filter zurücksetzen

### 3.3 Kanton-Filter
- [ ] Filter nach Kanton
- [ ] Nur Profile aus Kanton werden angezeigt
- [ ] Kombiniert mit Kategorie-Filter

### 3.4 GPS-Radius-Suche
- [ ] GPS-Standort aktivieren
- [ ] Radius-Slider (5-100 km)
- [ ] Automatische Aktualisierung bei Slider-Änderung
- [ ] Entfernung wird pro Profil angezeigt
- [ ] Sortierung nach Entfernung

### 3.5 Sortierung
- [ ] TOP Ads erscheinen zuerst
- [ ] Dann Premium Ads
- [ ] Dann Basic Ads
- [ ] Verifizierte vor Nicht-Verifizierten (innerhalb Tier)
- [ ] Weighted Random innerhalb Tier

### 3.6 Pagination
- [ ] Pagination funktioniert
- [ ] 12 Profile pro Seite
- [ ] Seiten-Navigation

---

## IV. 👤 Profil-Ansicht (Public)

> ⚠️ **KRITISCH: Profile müssen für ALLE sichtbar sein - auch ohne Login!**  
> Anonyme Besucher (nicht eingeloggt) müssen alle Profil-Infos und Kontaktdaten sehen können.

### 4.1 Daten-Anzeige (OHNE Login testen!)
- [ ] **Als NICHT eingeloggter User testen**
- [ ] Display-Name korrekt
- [ ] Alter korrekt
- [ ] Geschlecht korrekt
- [ ] Stadt & Kanton korrekt
- [ ] Sprachen korrekt
- [ ] Über mich Text korrekt
- [ ] Kategorien korrekt (max. 2)

### 4.2 Kontakt-Sichtbarkeit (OHNE Login testen!)
> ⚠️ **KRITISCH: Kontaktdaten für ALLE sichtbar - Business-Requirement!**
- [ ] **Als NICHT eingeloggter User alle Kontakte sichtbar:**
- [ ] E-Mail sichtbar (anon + auth)
- [ ] Telefon sichtbar (anon + auth)
- [ ] WhatsApp klickbar (anon + auth)
- [ ] Website klickbar (anon + auth)
- [ ] Instagram klickbar (anon + auth)
- [ ] Telegram klickbar (anon + auth)
- [ ] Strasse nur wenn "show_street = true"

### 4.3 Badges
- [ ] "Verifiziert" Badge bei verified_at
- [ ] "Premium" Badge bei Premium
- [ ] "TOP" Badge bei TOP
- [ ] Korrekte Badge-Farben

### 4.4 Foto-Galerie
- [ ] Primär-Foto wird angezeigt
- [ ] Galerie öffnet bei Klick
- [ ] Alle Fotos durchblätterbar

### 4.5 Aktionen
- [ ] "Melden" Button funktioniert
- [ ] Report-Dialog öffnet
- [ ] Report wird gespeichert
- [ ] "Favorit" Button (nur für eingeloggte)
- [ ] Favorit hinzufügen/entfernen

---

## V. 📊 User Dashboard

### 5.1 Übersicht
- [ ] Profil-Status wird angezeigt
- [ ] Profil-Views werden angezeigt
- [ ] Listing-Typ wird angezeigt
- [ ] Ablaufdatum wird angezeigt

### 5.2 Profil bearbeiten
- [ ] "Bearbeiten" Link funktioniert
- [ ] Alle Felder editierbar
- [ ] Änderungen werden gespeichert
- [ ] Fotos verwalten möglich

### 5.3 Favoriten
- [ ] Favoriten-Liste wird angezeigt
- [ ] Favorit entfernen funktioniert
- [ ] Link zum Profil funktioniert

### 5.4 Upgrade
- [ ] Upgrade-Option wird angezeigt
- [ ] Preis-Optionen korrekt
- [ ] Upgrade-Flow funktioniert

---

## VI. 🎯 Banner-System

### 6.1 Banner-Preisseite
- [ ] Preise korrekt angezeigt:
  - [ ] Popup: CHF 80/Tag
  - [ ] Top: CHF 50/Tag
  - [ ] Grid: CHF 30/Tag
- [ ] "EXKLUSIV" Badge sichtbar
- [ ] Wochen/Monats-Preise korrekt

### 6.2 Banner-Buchung (Anfrage)
- [ ] Buchungsformular öffnet
- [ ] Position wählbar (Popup/Top/Grid)
- [ ] Bild hochladen
- [ ] Link eingeben
- [ ] Dauer wählen (Tag/Woche/Monat)
- [ ] E-Mail eingeben
- [ ] Telefon eingeben (optional)
- [ ] Anfrage absenden
- [ ] Bestätigung erscheint

### 6.3 Banner-Anzeige
- [ ] Popup-Banner erscheint (mit Delay)
- [ ] Top-Banner wird angezeigt
- [ ] Grid-Banner wird angezeigt
- [ ] Nur 1 Banner pro Position (exklusiv)
- [ ] Klick öffnet Link

### 6.4 Banner-Tracking
- [ ] Impressions werden gezählt
- [ ] Klicks werden gezählt

---

## VII. 🛠️ Admin Dashboard

### 7.1 Admin Login
- [ ] Admin-Login funktioniert
- [ ] Nur Admin-Rolle hat Zugang
- [ ] Normale User werden abgewiesen

### 7.2 Dashboard-Übersicht
- [ ] Statistiken werden angezeigt
- [ ] Aktive Profile Anzahl
- [ ] Neue Profile (24h)
- [ ] Aktive Banner Anzahl
- [ ] Offene Meldungen

### 7.3 Profil-Management
- [ ] Liste aller Profile
- [ ] Filter nach Status
- [ ] Profil aktivieren
- [ ] Profil deaktivieren
- [ ] Profil löschen
- [ ] **Gratis-Listing vergeben:**
  - [ ] Listing-Typ wählen (Basic/Premium/TOP)
  - [ ] Dauer wählen (7/30/90 Tage/Unbegrenzt)
  - [ ] Aktivierung nur mit Foto möglich

### 7.4 Banner-Management
- [ ] Liste aller Banner-Anfragen
- [ ] Banner aktivieren mit Start/End-Datum
- [ ] Banner deaktivieren
- [ ] Banner löschen
- [ ] Positionen verwalten

### 7.5 Kategorien verwalten
- [ ] Kategorien-Liste
- [ ] Kategorie erstellen
- [ ] Kategorie bearbeiten
- [ ] Kategorie aktivieren/deaktivieren
- [ ] Sortierung ändern

### 7.6 Städte verwalten
- [ ] Städte-Liste
- [ ] Stadt erstellen
- [ ] Stadt bearbeiten
- [ ] GPS-Koordinaten setzen

### 7.7 Benutzer verwalten
- [ ] Benutzer-Liste
- [ ] Benutzer sperren/entsperren
- [ ] Rate-Limits anzeigen
- [ ] Rate-Limit entsperren

### 7.8 Verifizierungen
- [ ] Offene Verifizierungen anzeigen
- [ ] Dokument ansehen
- [ ] Verifizierung genehmigen
- [ ] Verifizierung ablehnen (mit Notiz)

### 7.9 Meldungen (Reports)
- [ ] Meldungen-Liste
- [ ] Meldung anzeigen
- [ ] Status ändern (pending/reviewed/resolved)
- [ ] Profil direkt deaktivieren

### 7.10 Kontakt-Nachrichten
- [ ] Nachrichten-Liste
- [ ] Nachricht lesen
- [ ] Als gelesen markieren

### 7.11 CMS Settings
- [ ] Alle 11 Kategorien sichtbar
- [ ] Settings editierbar
- [ ] Änderungen werden gespeichert
- [ ] Änderungen im Frontend sichtbar:
  - [ ] Datenschutz-Texte
  - [ ] AGB-Texte
  - [ ] Toast-Nachrichten
  - [ ] Preise

### 7.12 Export
- [ ] Datenbank-Export (CSV/JSON)
- [ ] Storage-Export (URLs)
- [ ] Schema-Export (SQL)
- [ ] Auth-Users Export
- [ ] Komplettes Migrations-Paket

---

## VIII. 📄 Statische Seiten (CMS)

### 8.1 Datenschutz
- [ ] Seite lädt
- [ ] Alle 12 Sektionen aus CMS
- [ ] Texte editierbar via Admin

### 8.2 AGB
- [ ] Seite lädt
- [ ] Inhalte aus CMS

### 8.3 Preise
- [ ] Seite lädt
- [ ] Preise aus CMS
- [ ] Features aus CMS

### 8.4 Kontakt
- [ ] Formular funktioniert
- [ ] Nachricht wird gespeichert
- [ ] Rate-Limiting aktiv

### 8.5 Banner-Preise
- [ ] Seite lädt
- [ ] Preise korrekt

---

## IX. 📱 Responsive & UX

### 9.1 Mobile (< 768px)
- [ ] Navigation funktioniert (Hamburger)
- [ ] Profil-Cards responsive
- [ ] Such-Filter responsive
- [ ] Dashboard responsive
- [ ] Formulare responsive

### 9.2 Tablet (768px - 1024px)
- [ ] Layout passt sich an
- [ ] Grid-Anzeige korrekt

### 9.3 Desktop (> 1024px)
- [ ] Volle Breite genutzt
- [ ] Sidebar korrekt (falls vorhanden)

### 9.4 UX
- [ ] Loading-States werden angezeigt
- [ ] Error-States werden angezeigt
- [ ] Toast-Nachrichten erscheinen
- [ ] Navigation intuitiv

---

## X. 🔒 Sicherheit

### 10.1 RLS (Row Level Security)
- [ ] User kann nur eigenes Profil bearbeiten
- [ ] User kann fremde Profile nicht löschen
- [ ] Kontaktdaten für alle sichtbar (aktive Profile)
- [ ] Admin kann alles

### 10.2 Auth
- [ ] Rate-Limiting funktioniert
- [ ] Session-Timeout funktioniert
- [ ] Admin-Bereich geschützt

### 10.3 Input Validation
- [ ] SQL-Injection nicht möglich
- [ ] XSS nicht möglich
- [ ] File-Upload validiert (Magic Bytes)

---

## 🚨 Kritische Test-Priorität

### Muss vor Launch funktionieren:
1. ✅ Registrierung & Login
2. ⏳ **E-Mail-Bestätigung (Anti-Fake) - NOCH IMPLEMENTIEREN**
3. ✅ Profil erstellen mit Fotos
4. ✅ Suche & Filter (inkl. GPS)
5. ✅ **Kontaktdaten sichtbar für ALLE (auch ohne Login!)**
6. ✅ Admin kann Profile aktivieren
7. ✅ Banner-System
8. ⏳ Saferpay Payment (nach diesen Tests)

---

## 📝 Test-Notizen

| Datum | Tester | Bereich | Status | Notizen |
|-------|--------|---------|--------|---------|
| | | | | |
| | | | | |
| | | | | |

---

## 🔄 Test-Reihenfolge (Empfohlen)

1. **Fotos hochladen** zu bestehenden Test-Profilen
2. **Suche testen** mit allen Filtern
3. **Banner erstellen** und testen
4. **Admin-Dashboard** durchgehen
5. **CMS-Änderung** → Frontend prüfen
6. **Neues Profil** komplett erstellen
7. **Mobile** durchspielen
8. **Saferpay** integrieren und testen
