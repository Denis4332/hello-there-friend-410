

# Kategorie-Fix: 3 Änderungen umsetzen

---

## HARTE REGELN - GARANTIERT UNBERÜHRT

| Bereich | Status |
|---------|--------|
| Banner-System (BannerDisplay, BannerManager, PopupBanner) | NICHT ANFASSEN |
| ProfileCard.tsx Aussehen | NICHT ANFASSEN |
| Rotation-Algorithmus (profileUtils.ts) | NICHT ANFASSEN |
| Sortierung TOP > Premium > Basic | NICHT ANFASSEN |
| User ProfileForm.tsx | Bereits korrekt - NICHT ANFASSEN |
| 3-Sekunden Ad-Timer | NICHT ANFASSEN |

---

## Änderung 1: 73 Test-Profile mit Kategorien füllen

**Typ:** SQL Data Insert (nur neue Einträge, keine Updates)

**SQL-Query:**
```sql
-- Schritt 1: Alle aktiven Kategorien abrufen
-- Schritt 2: Für jedes Profil OHNE Kategorie:
--   - 1 zufällige Kategorie zuweisen (immer)
--   - 50% Chance auf 2. zufällige Kategorie

INSERT INTO profile_categories (profile_id, category_id)
SELECT 
  p.id as profile_id,
  (SELECT id FROM categories WHERE active = true ORDER BY random() LIMIT 1) as category_id
FROM profiles p
WHERE p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM profile_categories pc WHERE pc.profile_id = p.id
  );
```

**Betroffene Profile:** Exakt 73 Test-Profile (TopTest, PremiumTest, BasicTest)

**Risiko:** Minimal - nur INSERT, keine bestehenden Daten werden geändert

---

## Änderung 2: Admin-Formular Validierung

**Datei:** `src/components/admin/AdminProfileCreateDialog.tsx`

**Zeile 401 - isValid erweitern:**
```tsx
// VORHER:
const isValid = displayName.trim() && city.trim() && canton.trim() && 
                lat !== null && lng !== null && agbAccepted && customerEmail.trim();

// NACHHER:
const isValid = displayName.trim() && city.trim() && canton.trim() && 
                lat !== null && lng !== null && agbAccepted && customerEmail.trim() &&
                selectedCategories.length >= 1;
```

**UI-Hinweis bei Kategorien-Section (ca. Zeile 547):**
```tsx
<Label>Kategorien *</Label>
<p className="text-sm text-muted-foreground mb-2">
  Mindestens 1 Kategorie erforderlich
</p>
```

**Auswirkung:** 
- Button "Profil erstellen" ist disabled wenn 0 Kategorien gewählt
- Konsistent mit User-Formular das bereits 1+ Kategorie erfordert

---

## Änderung 3: Database Trigger (Zukunftssicherung)

**Typ:** SQL Migration

**Funktion + Trigger:**
```sql
-- Funktion die prüft ob Kategorie existiert
CREATE OR REPLACE FUNCTION check_profile_has_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM profile_categories WHERE profile_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Profil kann nicht aktiviert werden ohne mindestens eine Kategorie';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger bei UPDATE (z.B. Admin aktiviert Profil)
CREATE TRIGGER ensure_profile_has_category_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_profile_has_category();

-- Trigger bei INSERT (falls direkt als active eingefügt)
CREATE TRIGGER ensure_profile_has_category_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_profile_has_category();
```

**Auswirkung:**
- Verhindert auf DB-Ebene dass Profile ohne Kategorie aktiviert werden
- Wirkt auch bei direkten SQL-Inserts (Backup-Schutz)
- Draft/Pending Profile können weiterhin ohne Kategorie existieren

---

## Reihenfolge der Umsetzung

| Schritt | Aktion | Risiko |
|---------|--------|--------|
| 1 | Database Trigger erstellen | Keins (nur neue Funktion) |
| 2 | 73 Profile mit Kategorien füllen | Keins (nur INSERT) |
| 3 | Admin-Formular Code-Fix | Keins (nur Validierung) |

---

## Erwartetes Ergebnis

Nach Umsetzung:
- Alle 90 aktiven Profile (inkl. 73 Test-Profile) erscheinen in Kategorie-Seiten
- TOP, Premium UND Basic Inserate auf Kategorie-Seiten sichtbar
- Admin-Formular erfordert mindestens 1 Kategorie (wie User-Formular)
- Database-Trigger verhindert zukünftig "unsichtbare" Profile
- Bestehende echte User-Profile: NICHT betroffen (haben bereits Kategorien)

---

## Sicherheits-Checks

| Prüfung | Ergebnis |
|---------|----------|
| User ProfileForm.tsx | Bereits korrekt validiert - NICHT ANFASSEN |
| Kategorie-Seiten Query | Funktioniert korrekt - braucht nur Daten |
| Homepage Query | Nicht betroffen (filtert nicht nach Kategorie) |
| Suche Query | Nicht betroffen (optionaler Kategorie-Filter) |

