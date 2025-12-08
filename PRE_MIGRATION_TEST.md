# Pre-Migration Test-Checkliste

**Geschätzte Dauer:** 30-45 Minuten  
**Ziel:** Kritische Funktionen vor Migration verifizieren

---

## 🔐 1. Authentifizierung (5 Min)

- [ ] **Registrierung:** Neuen Account erstellen (test@example.com)
- [ ] **Login:** Mit neuem Account einloggen
- [ ] **Logout:** Ausloggen funktioniert
- [ ] **Passwort vergessen:** Link wird angezeigt (E-Mail kommt erst nach Migration)

---

## 📝 2. Profil-Erstellung (10 Min)

- [ ] **Profil erstellen:** `/profil/erstellen` aufrufen
- [ ] **Formular:** Name, Kanton, Stadt auswählen (Stadt-Dropdown funktioniert)
- [ ] **Kategorien:** 2 Kategorien auswählen (Maximum-Check)
- [ ] **Listing-Typ:** Basic/Premium/TOP wählen
- [ ] **Foto-Upload:** Mindestens 1 Foto hochladen
- [ ] **Speichern:** Profil wird erstellt (Status = "pending")

---

## 🔍 3. Suche & Filter (10 Min)

- [ ] **Homepage:** Profile werden angezeigt (TOP zuerst)
- [ ] **GPS-Suche:** "Standort erkennen" → Radius-Slider funktioniert
- [ ] **Kanton-Filter:** Kanton wählen → nur Profile aus Kanton
- [ ] **Kategorie-Filter:** Kategorie wählen → nur passende Profile
- [ ] **Kombination:** Kanton + Kategorie zusammen testen
- [ ] **Stadt-Seite:** `/stadt/zuerich` → Profile aus Zürich
- [ ] **Kategorie-Seite:** `/kategorie/escort` → Profile der Kategorie

---

## 👤 4. Profil-Ansicht (5 Min)

- [ ] **Öffentlich sichtbar:** Profil ohne Login aufrufbar ✅
- [ ] **Kontaktdaten:** Telefon, WhatsApp, E-Mail sichtbar (ohne Login!)
- [ ] **Bilder:** Galerie mit Lightbox funktioniert
- [ ] **Favoriten:** Herz-Icon (nur für eingeloggte User)

---

## 📊 5. User Dashboard (5 Min)

- [ ] **Mein Profil:** `/mein-profil` zeigt eigenes Profil
- [ ] **Bearbeiten:** Profil-Daten ändern funktioniert
- [ ] **Favoriten:** `/favoriten` zeigt gespeicherte Profile

---

## 🛡️ 6. Admin Dashboard (10 Min)

- [ ] **Login:** `/admin` → Admin-Login funktioniert
- [ ] **Profile:** Alle Profile sichtbar, Status ändern
- [ ] **Profil aktivieren:** "Gratis freischalten" funktioniert
- [ ] **Banner:** Banner erstellen/bearbeiten
- [ ] **Kategorien:** Kategorien bearbeiten
- [ ] **CMS-Settings:** Einstellungen ändern → Frontend aktualisiert
- [ ] **Export:** Daten-Export funktioniert (CSV/JSON)

---

## 📱 7. Mobile & Responsiveness (3 Min)

- [ ] **Homepage:** Mobile Ansicht OK
- [ ] **Suche:** Filter-Popover funktioniert
- [ ] **Profil:** Bilder-Galerie scrollbar

---

## 🎯 8. Banner-System (2 Min)

- [ ] **Top-Banner:** Auf Suchseite sichtbar
- [ ] **Popup-Banner:** Nach 3 Sek auf Homepage
- [ ] **Banner-Klick:** Link öffnet sich

---

## ✅ Ergebnis-Zusammenfassung

| Bereich | Status | Notizen |
|---------|--------|---------|
| Auth | ⬜ | |
| Profil-Erstellung | ⬜ | |
| Suche/Filter | ⬜ | |
| Profil-Ansicht | ⬜ | |
| User Dashboard | ⬜ | |
| Admin Dashboard | ⬜ | |
| Mobile | ⬜ | |
| Banner | ⬜ | |

**Legende:** ✅ OK | ⚠️ Teilweise | ❌ Fehler

---

## 🚨 Kritische Punkte (MUSS funktionieren)

1. **Profile OHNE Login sichtbar** (Kontaktdaten!)
2. **GPS-Koordinaten** bei neuen Profilen automatisch gesetzt
3. **Admin kann Profile aktivieren** (Gratis oder Pending→Active)
4. **Profil-Rotation** alle 30 Min (gleiche Tier rotieren)
5. **Export-Funktionen** für Migration bereit

---

## Nach erfolgreichen Tests → Migration starten

Siehe `MIGRATION.md` für den vollständigen Migrations-Prozess.
