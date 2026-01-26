
# ESCORIA.CH COMPREHENSIVE AUDIT REPORT

## EXECUTIVE SUMMARY

**Project:** escoria.ch - Swiss Adult Services Directory  
**Status:** Late Development / Pre-Launch  
**Date:** 26.01.2026  
**Mode:** READ-ONLY ANALYSIS  

---

## A) END-TO-END FUNKTIONS-AUDIT

### PUBLIC ROUTES (Für jeden sichtbar, auch ohne Login)

| Route | Status | Dateien | Anmerkungen |
|-------|--------|---------|-------------|
| `/` (Homepage) | ✅ | `src/pages/Index.tsx` | Profiles laden via `useHomepageProfiles`, Rotation funktioniert |
| `/suche` | ✅ | `src/pages/Suche.tsx` | GPS-Suche, Text-Suche, Pagination, Kategorien - ALLES FUNKTIONAL |
| `/profil/:slug` | ✅ | `src/pages/Profil.tsx` | RLS policy erlaubt `status='active'` für Public |
| `/stadt/:slug` | ✅ | `src/pages/Stadt.tsx` | City-Profile mit Pagination |
| `/kategorie/:slug` | ✅ | `src/pages/Kategorie.tsx` | Category-Profile mit Pagination |
| `/kantone` | ✅ | `src/pages/Kantone.tsx` | Canton-Liste |
| `/kategorien` | ✅ | `src/pages/Categories.tsx` | Kategorie-Liste |
| `/kontakt` | ✅ | `src/pages/Kontakt.tsx` | Kontaktformular |
| `/agb`, `/datenschutz`, `/impressum` | ✅ | Legal Pages | Static content |
| `/preise` | ✅ | `src/pages/Preise.tsx` | Pricing info |
| `/bannerpreise` | ✅ | `src/pages/Bannerpreise.tsx` | Banner pricing |

### AUTH ROUTES

| Route | Status | Dateien | Anmerkungen |
|-------|--------|---------|-------------|
| `/auth` | ✅ | `src/pages/Auth.tsx` | Login + Signup, AGB-Checkbox, Rate-Limiting |
| `/auth/callback` | ✅ | `src/pages/AuthCallback.tsx` | Magic Link Callback |
| `/reset-password` | ✅ | `src/pages/ResetPassword.tsx` | Password Reset |

**Login + Redirect `/mein-profil`:**
- **Status:** ✅ FUNKTIONIERT
- **Flow:** `Auth.tsx:66-73` - `nextPath = searchParams.get('next') || '/mein-profil'`
- **Prefetch:** `Auth.tsx:130-152` - Dashboard-Daten werden im Hintergrund vorgeladen
- **ABER:** Variabilität möglich durch:
  1. `loadUserRole()` in `AuthContext.tsx:86-112` - 2 sequentielle DB-Calls
  2. Rate-Limit Check vor Login (`checkRateLimit` Edge Function)

### CREATE FLOW (Protected Route: `/profil/erstellen`)

| Step | Status | Dateien | Details |
|------|--------|---------|---------|
| 1. Form (Basisdaten) | ✅ | `ProfileCreate.tsx:388-426` | AGB-Checkbox required, City-Combobox |
| 2. Listing-Type | ✅ | `ProfileCreate.tsx:428-436` | Basic/Premium/TOP Auswahl |
| 3. Photos | ✅ | `ProfileCreate.tsx:439-477` | Min. 1 Foto required, Video-Support |
| 4. Verification | ✅ | `VerificationUploader.tsx` | Optional, kann übersprungen werden |
| 5. Payment Modal | ✅ | `ProfileCreate.tsx:343-358` | **KEIN Auto-Redirect** - Modal öffnet sich |

**WICHTIG:** Payment Modal wird via `setShowPaymentModal(true)` geöffnet, KEIN automatischer Redirect! (`ProfileCreate.tsx:343-358`)

### UPGRADE/DOWNGRADE LOGIK

| Aktion | Vor Zahlung | Nach Zahlung | Status |
|--------|-------------|--------------|--------|
| Paket wählen | ✅ Möglich | ❌ Gesperrt | ✅ |
| Paket ändern | ✅ Möglich via "Paket ändern" Button | ❌ Nur via Admin | ✅ |
| Profil bearbeiten | ✅ Möglich | ✅ Möglich | ✅ |

**Code:** `ProfileCreate.tsx:443-450` - "Paket ändern" Button führt zurück zu Step 2

### GPS-SUCHE (KRITISCH - NICHT ÄNDERN!)

| Feature | Status | Dateien | Details |
|---------|--------|---------|---------|
| Standort erkennen | ✅ | `src/lib/geolocation.ts` | Nominatim + DB-Lookup für korrekte City-Namen |
| Radius-Slider | ✅ | `SearchFilters.tsx` | 5-100km |
| Kategorie-Filter | ✅ | `Suche.tsx:62-68` | In GPS-Query integriert |
| Keyword-Filter | ✅ | `Suche.tsx:63` | In GPS-Query integriert |
| Pagination | ✅ | `useProfiles.ts:226-344` | Server-side via RPC |
| RotationSeed | ✅ | `useRotationKey.ts` | 10-Minuten-Rotation |

**DB-Funktion:** `search_profiles_by_radius_v2` mit embedded Photos + Categories (1 Request statt 3)

### ADMIN DASHBOARD

| Feature | Status | Route | Datei |
|---------|--------|-------|-------|
| Dashboard Stats | ✅ | `/admin` | `AdminDashboard.tsx` |
| Profile prüfen/aktivieren | ✅ | `/admin/profile` | `AdminProfile.tsx` (1575 Lines!) |
| Pending Payments | ✅ | `/admin/pending-payments` | `AdminPendingPayments.tsx` |
| Verifications | ✅ | `/admin/verifications` | `AdminVerifications.tsx` |
| Exports | ⚠️ | `/admin/export` | `AdminExport.tsx` - SENSITIV (Kontaktdaten!) |

**verification_submissions Tabelle:** ✅ EXISTIERT (siehe Supabase Schema)

### PAYPORT FLOW

| Schritt | Status | Datei | Details |
|---------|--------|-------|---------|
| Checkout | ✅ | `payport-checkout/index.ts` | Hash-Berechnung, ID-Mapping |
| Return | ✅ | `payport-return/index.ts` | Hash-Verify, getTransactionStatus, releaseTransaction |
| DB Update | ✅ | `payport-return/index.ts:260-286` | payment_status='paid', payment_reference=tk |
| Logging | ✅ | Alle Steps mit Console-Logs | Debugging via `?debug=1` |
| Deployed | ✅ | Secrets vorhanden | 11 PayPort-Secrets konfiguriert |

**Secrets Check:** PAYPORT_AK, PAYPORT_SECRET, PAYPORT_C, PAYPORT_CC, PAYPORT_CHECKOUT_URL, PAYPORT_API_BASE_URL, PAYPORT_INTERFACE ✅

---

## B) PERFORMANCE-AUDIT MIT VARIABILITÄT

### URSACHEN FÜR "MAL SCHNELL / MAL LANGSAM"

#### 1. CACHING / REACT QUERY EINSTELLUNGEN

| Hook/Query | staleTime | gcTime | Refetch | Problem? |
|------------|-----------|--------|---------|----------|
| `useBatchSiteSettings` | 30 min | 1 h | Never | ✅ Optimal |
| `useHomepageProfiles` | 5 min | (default) | onMount: false | ✅ OK |
| `useSearchProfiles` | 30 sec | (default) | onWindowFocus: false | ✅ OK |
| `useProfilesByRadius` (GPS) | 10 sec | 30 sec | onMount: true | ⚠️ Sehr kurz! |
| `useProfileBySlug` | 5 min | (default) | (default) | ✅ OK |

**VARIABILITÄT-URSACHE #1:** `useProfilesByRadius` hat nur 10s staleTime - bei Navigation hin/zurück wird IMMER neu geladen!

#### 2. SUPABASE LATENCY / OVERFETCH

| Call | Ort | Impact | Problem? |
|------|-----|--------|----------|
| `site_settings` (all rows) | App-Init | ~50-100ms | ⚠️ Blockiert Render bis geladen |
| `user_roles` Query | `loadUserRole()` | ~30-50ms | ⚠️ Sequentiell nach Session |
| `get_paginated_profiles` RPC | Homepage/Search | ~100-200ms | ✅ Optimiert |
| Admin Stats (8 Queries) | AdminDashboard | ~400-800ms | ⚠️ 8 COUNT-Queries sequentiell! |

**VARIABILITÄT-URSACHE #2:** `AuthContext.tsx:68-77` - `setTimeout(loadUserRole, 0)` läuft ASYNCHRON nach Auth-State-Change. Bei Netzwerk-Schwankungen dauert das länger.

#### 3. STORAGE / BILDER

| Kontext | Größe | Transform | Problem? |
|---------|-------|-----------|----------|
| Carousel (Profil) | 800px width | `?width=800&quality=70` | ✅ Optimiert |
| Lightbox | 1920px width | `?width=1920&quality=80` | ✅ OK |
| ProfileCard | Direct URL | KEINE Transform! | ⚠️ Volle Größe! |
| Banner | Direct URL | KEINE Transform! | ⚠️ Volle Größe! |

**VARIABILITÄT-URSACHE #3:** ProfileCards (Grid-Ansicht) laden ORIGINAL-Bilder ohne Resize. Bei 24 Profilen = 24 große Bilder parallel!

#### 4. THIRD-PARTY SCRIPTS

**Gefunden:** `cdn.tailwindcss.com` in Console-Logs! 
**Problem:** Production sollte KEIN CDN-Tailwind verwenden!

**Console Warning:** "cdn.tailwindcss.com should not be used in production"

#### 5. REALTIME / WEBSOCKETS

| Feature | Aktiv? | Wo? | Nötig? |
|---------|--------|-----|--------|
| Realtime on /suche | ❌ DEAKTIVIERT | `Suche.tsx:18` Comment | ✅ Korrekt |
| Realtime elsewhere | ❓ Unbekannt | - | Needs check |

**Gut:** Realtime wurde bewusst auf /suche deaktiviert für Performance.

#### 6. EDGE FUNCTIONS - KALTSTARTS

| Function | Logs | Startup Time | Problem? |
|----------|------|--------------|----------|
| `track-event` | "booted (time: 30ms)" | ~30ms | ✅ OK |
| `track-ad-event` | "booted (time: 29ms)" | ~29ms | ✅ OK |
| `check-subscription-expiry` | "booted (time: 226ms)" | ~226ms | ⚠️ Langsam |
| `generate-sitemap` | "booted (time: 348ms)" | ~348ms | ⚠️ Langsam |

Kaltstart-Zeiten sind NORMAL für Edge Functions, aber nicht die Ursache für UI-Lags.

### ROUTE-BY-ROUTE ANALYSE

#### `/` (Homepage)

**Calls:**
1. `batch-site-settings` → site_settings (alle)
2. `homepage-profiles-paginated` → RPC get_paginated_profiles
3. `categories` → categories table
4. `cantons` → cantons table
5. `track-event` → Edge Function
6. `track-ad-event` (x2) → Edge Function für Banner

**Blockiert LCP:** site_settings muss laden bevor Render beginnt (Context Provider)

**Hänger-Ursache:** Keiner identifiziert - Homepage ist relativ schnell.

#### `/suche` (ohne GPS)

**Calls:**
1. batch-site-settings
2. search-profiles-paginated → RPC get_paginated_profiles
3. categories
4. cantons

**Performance:** ✅ Gut - 30s staleTime verhindert Flackern

#### `/suche` (mit GPS)

**Calls:**
1. batch-site-settings
2. profiles-by-radius-paginated → RPC search_profiles_by_radius_v2
3. categories
4. cantons

**Hänger-Ursache:** 
- staleTime nur 10s - Navigation hin/zurück = Neuladung
- Debounce 300ms bei Radius-Änderung

#### `/profil/:slug`

**Calls:**
1. profile (by slug)
2. profile_contacts (separate Query!)
3. categories
4. dropdown_options (report_reasons)
5. track-profile-view → Edge Function

**Hänger-Ursache:** 
- 2 sequentielle Queries (Profile, dann Contacts)
- Bild-Carousel lädt ALLE Bilder sofort (kein lazy load für erstes Bild)

#### `/auth`

**Calls:**
1. batch-site-settings

**Nach Login:**
1. auth.signInWithPassword → Supabase Auth
2. recordAttempt → check-auth-rate-limit Edge Function
3. loadUserRole → user_roles Query
4. Prefetch profile-own (async)
5. Navigate to /mein-profil

**VARIABILITÄT-URSACHE #4:** `recordAttempt` und `loadUserRole` laufen NACH Login aber VOR Navigate. Bei langsamer DB = verzögerte Weiterleitung.

#### `/mein-profil`

**Calls:**
1. batch-site-settings
2. profile (user's own) → profiles + profile_categories JOIN
3. photos → photos table

**Performance:** ✅ Normalerweise schnell, aber kann langsam sein wenn:
- Cache leer (erste Besuch)
- Prefetch von Auth fehlgeschlagen

---

## C) FAVICON-FORENSIK

### AKTUELLE QUELLEN

**index.html:29-30:**
```html
<link rel="icon" type="image/jpeg" href="https://storage.googleapis.com/gpt-engineer-file-uploads/N44JxG6l9FfXwXIyhVxr0FQRzKG2/uploads/1768215135421-WhatsApp Image 2026-01-12 at 11.51.44.jpeg">
<link rel="apple-touch-icon" href="https://storage.googleapis.com/gpt-engineer-file-uploads/N44JxG6l9FfXwXIyhVxr0FQRzKG2/uploads/1768215135421-WhatsApp Image 2026-01-12 at 11.51.44.jpeg">
```

**PROBLEM:**
1. Beide URLs sind IDENTISCH (gut - Single Source)
2. Format ist JPEG (nicht optimal für Favicon, sollte PNG/ICO sein)
3. URL enthält Leerzeichen ("WhatsApp Image") - kann Probleme verursachen
4. Gehostet auf externem CDN (gpt-engineer-file-uploads)

### WARUM SAFARI DOPPELT ZEIGT

Safari cached Favicons aggressiv. Mögliche Ursachen:
1. **Cache-Konflikt:** Ältere Version im Safari-Cache + neue Version geladen
2. **Touch-Icon vs Favicon:** Safari zeigt manchmal beide wenn beide definiert

### SINGLE SOURCE OF TRUTH EMPFEHLUNG

```
/public/favicon.png  (120x120px, PNG, Herz-Icon rechts OHNE weissen Rand)
```

### SAFARI CACHE TEST CHECKLISTE

1. Safari schließen (komplett beenden, nicht nur Tab)
2. `Safari > Verlauf > Verlauf löschen... > Gesamter Verlauf`
3. Finder: `Cmd+Shift+G` → `~/Library/Safari/Favicon Cache/`
4. Cache-Ordner komplett löschen
5. Safari neu starten
6. Website aufrufen (Hard Refresh: Cmd+Shift+R)

**iOS Safari:**
1. Einstellungen > Safari > Verlauf und Websitedaten löschen
2. iPhone neu starten
3. Website neu öffnen

---

## D) SAFE WINS vs RISKY CHANGES

### SAFE WINS (Keine Breaking Changes)

| # | Maßnahme | Impact | Risiko | Was könnte kaputtgehen | Test |
|---|----------|--------|--------|------------------------|------|
| 1 | ProfileCard Bilder mit `?width=400&quality=70` laden | ⬆️ HIGH - 24 Bilder pro Page kleiner | ⬇️ LOW | Evtl. unscharf bei Retina | Visueller Check |
| 2 | `useProfilesByRadius` staleTime auf 60s erhöhen | ⬆️ MED - Weniger Refetches | ⬇️ NONE | Daten 60s statt 10s alt | GPS-Suche testen |
| 3 | site_settings mit SSR/Pre-Load | ⬆️ MED - Schnellerer First Paint | ⬇️ LOW | - | LCP messen |
| 4 | AdminDashboard Stats in 1 RPC zusammenfassen | ⬆️ MED - 8 Calls → 1 Call | ⬇️ LOW | Admin-Zahlen falsch | Admin prüfen |
| 5 | Tailwind CDN entfernen (prod build) | ⬆️ LOW | ⬇️ NONE | - | Build testen |

### RISKY CHANGES (Vorsicht geboten)

| # | Maßnahme | Impact | Risiko | Was könnte kaputtgehen | Test |
|---|----------|--------|--------|------------------------|------|
| R1 | GPS search_profiles_by_radius_v2 modifizieren | ⬆️ MED | ⬆️ HIGH | GPS-Suche komplett kaputt! | E2E Test |
| R2 | RLS Policies ändern | ⬆️ VAR | ⬆️ CRITICAL | User können Daten nicht sehen/schreiben | Alle Flows testen |
| R3 | Auth Flow ändern | ⬆️ VAR | ⬆️ CRITICAL | Login kaputt | Alle Auth-Flows testen |
| R4 | PayPort Integration ändern | ⬆️ VAR | ⬆️ CRITICAL | Zahlungen fehlschlagen | Test-Zahlung |

---

## E) READY SCORE

### KATEGORIEN-BEWERTUNG

| Kategorie | Score | Details |
|-----------|-------|---------|
| **Funktionalität** | 85/100 | Core-Features funktionieren, PayPort integriert, GPS-Suche OK |
| **Stabilität** | 70/100 | Variabilität bei Login/Redirect, einige Edge Cases |
| **Performance** | 60/100 | Bilder nicht optimiert, staleTime zu kurz, 8 Admin-Queries |
| **SEO** | 80/100 | SEO-Component vorhanden, Schema.org, Breadcrumbs |
| **Security** | 65/100 | 2 ERROR-Level Linter Issues, overly permissive RLS |

### GESAMTSCORE

```
╔═══════════════════════════════════════════════════╗
║           READY SCORE: 72 / 100                   ║
╠═══════════════════════════════════════════════════╣
║  Funktionalität:  ████████░░  85%                 ║
║  Stabilität:      ███████░░░  70%                 ║
║  Performance:     ██████░░░░  60%                 ║
║  SEO:             ████████░░  80%                 ║
║  Security:        ██████░░░░  65%                 ║
╚═══════════════════════════════════════════════════╝
```

### GO / NO-GO EMPFEHLUNG

```
╔════════════════════════════════════════════════════════════════╗
║                    BEDINGT GO FÜR SOFT-LAUNCH                  ║
╚════════════════════════════════════════════════════════════════╝
```

**VOR SOFT-LAUNCH ZWINGEND:**

1. ❌ **Security Linter ERROR #1 fixen:** Security Definer View
2. ❌ **Security Linter ERROR #4 fixen:** RLS Disabled in Public
3. ❌ **Favicon URL-Escape:** Leerzeichen in URL entfernen

**FÜR SOFT-LAUNCH EMPFOHLEN (nicht zwingend):**

4. ⚠️ ProfileCard Bilder optimieren
5. ⚠️ staleTime bei GPS-Suche erhöhen
6. ⚠️ Tailwind CDN entfernen

**NACH SOFT-LAUNCH:**

7. Admin Dashboard RPC optimieren
8. Login-Flow Latenz untersuchen
9. Realtime-Nutzung auditieren

---

## KRITISCHE DATEIEN (für Referenz)

| Feature | Haupt-Datei | Zeilen |
|---------|-------------|--------|
| GPS-Suche | `src/hooks/useProfiles.ts` | 226-344 |
| GPS-Geolocation | `src/lib/geolocation.ts` | Komplett |
| Auth Context | `src/contexts/AuthContext.tsx` | 36-84 (Init) |
| Site Settings | `src/hooks/useBatchSiteSettings.ts` | Komplett |
| PayPort Checkout | `supabase/functions/payport-checkout/index.ts` | Komplett |
| PayPort Return | `supabase/functions/payport-return/index.ts` | Komplett |
| Profile Create | `src/pages/ProfileCreate.tsx` | 300-359 (Payment) |
| Rotation Key | `src/hooks/useRotationKey.ts` | Komplett |

