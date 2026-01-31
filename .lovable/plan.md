
# Settings-Kategorien korrigieren + Favicon funktional machen

## Analyse

### Problem 1: Falsche Kategorien
Die Admin-Tabs "Suche", "Profile", "Dashboard", "Auth", "Kontakt", "Listen", "Konfiguration", "Erweitert" sind LEER, weil alle Settings unter `category='content'` gespeichert sind statt in ihrer richtigen Kategorie.

**Beispiele aus der Datenbank:**
- `dashboard_edit_profile_text` → hat `category='content'` statt `category='dashboard'`
- `search_page_title` → hat `category='content'` statt `category='search'`
- `auth_login_title` → hat `category='content'` statt `category='auth'`

### Problem 2: Favicon nicht aktiv
Das Setting `design_favicon_url` existiert in der Datenbank, wird aber in SEO.tsx nicht verwendet.

---

## Lösung

### Änderung 1: Datenbank-Migration

**SQL UPDATE-Statements um Settings in die richtige Kategorie zu verschieben:**

```sql
-- Dashboard Settings (dashboard_*)
UPDATE site_settings SET category = 'dashboard' 
WHERE key LIKE 'dashboard_%' AND category = 'content';

-- Search Settings (search_*)
UPDATE site_settings SET category = 'search' 
WHERE key LIKE 'search_%' AND category = 'content';

-- Auth Settings (auth_*)
UPDATE site_settings SET category = 'auth' 
WHERE key LIKE 'auth_%' AND category = 'content';

-- Contact Settings (contact_*)
UPDATE site_settings SET category = 'contact' 
WHERE key LIKE 'contact_%' AND category = 'content';

-- Profile Settings (profile_* aber NICHT seo_profile_*)
UPDATE site_settings SET category = 'profile' 
WHERE key LIKE 'profile_%' AND category = 'content';

-- Config Settings (config_*)
UPDATE site_settings SET category = 'config' 
WHERE key LIKE 'config_%' AND category = 'content';

-- Advanced Settings (advanced_*)
UPDATE site_settings SET category = 'advanced' 
WHERE key LIKE 'advanced_%' AND category = 'content';

-- Listings Settings (listing_*)
UPDATE site_settings SET category = 'listings' 
WHERE key LIKE 'listing_%' AND category = 'content';

-- Banner Settings (banner_*)
UPDATE site_settings SET category = 'content' 
WHERE key LIKE 'banner_%' AND category = 'content';
-- Bleiben bei content (Startseite), da Banner-Preise zur Hauptseite gehören
```

### Änderung 2: SEO.tsx - Favicon aktivieren

**Datei:** `src/components/SEO.tsx`

**Zeile 43 - Neues Setting laden:**
```tsx
const faviconUrl = getSetting('design_favicon_url');
```

**Zeile 86 (nach canonical, vor Helmet schließt) - Favicon-Tag hinzufügen:**
```tsx
{/* Dynamic Favicon */}
{faviconUrl && <link rel="icon" type="image/png" href={faviconUrl} />}
{faviconUrl && <link rel="apple-touch-icon" href={faviconUrl} />}
```

---

## Zusammenfassung

| Datei/Ort | Änderung |
|-----------|----------|
| **Migration** | 8 UPDATE-Statements für Kategorie-Korrektur |
| **SEO.tsx** | Favicon aus `design_favicon_url` laden + rendern |

## Erwartetes Ergebnis nach Migration

| Kategorie | Anzahl Settings (ca.) |
|-----------|----------------------|
| content | ~25 (Homepage, Banner) |
| dashboard | ~15 |
| search | ~8 |
| auth | ~15 |
| contact | ~8 |
| profile | ~10 |
| config | ~3 |
| advanced | ~2 |
| listings | ~5 |
| design | 10 (unverändert) |
| seo | 15 (unverändert) |

Die Admin-Tabs werden dann korrekt befüllt sein.
