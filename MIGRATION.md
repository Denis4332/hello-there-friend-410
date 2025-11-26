# ESCORIA - Migrations-Anleitung für Self-Hosting

Diese Anleitung hilft dir, deine ESCORIA-Plattform von Lovable Cloud auf einen eigenen Server zu migrieren.

## 📋 Voraussetzungen

- Node.js 18+ & npm/bun installiert
- Supabase Account (oder selbst gehostete Supabase-Instanz)
- Git installiert
- Zugriff auf dein GitHub Repository

---

## 🚀 Schritt-für-Schritt Migration

### 1. Repository klonen

```bash
git clone https://github.com/DEIN-USERNAME/DEIN-REPO.git
cd DEIN-REPO
npm install  # oder: bun install
```

---

### 2. Supabase-Projekt erstellen

#### Option A: Supabase Cloud (empfohlen)
1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Notiere dir:
   - `Project URL` (z.B. `https://xyz.supabase.co`)
   - `anon/public` API Key
   - `service_role` Secret Key (für Admin-Operationen)

#### Option B: Self-Hosted Supabase
- Folge der [offiziellen Anleitung](https://supabase.com/docs/guides/self-hosting)
- Docker Compose Setup empfohlen

---

### 3. Datenbank-Schema erstellen

Alle Migrations-Files befinden sich in `supabase/migrations/`.

**Wichtig:** Diese Migrationen müssen in chronologischer Reihenfolge ausgeführt werden!

```bash
# Supabase CLI installieren
npm install -g supabase

# Mit deinem Projekt verbinden
supabase link --project-ref DEIN_PROJECT_REF

# Alle Migrationen anwenden
supabase db push
```

**Alternativ (manuell):**
1. Öffne Supabase Dashboard → SQL Editor
2. Führe jede Migration aus `supabase/migrations/` in chronologischer Reihenfolge aus

---

### 4. Daten importieren

#### 4.1 Tabellen-Daten (aus Admin-Export)

Exportiere alle Daten über Admin-Dashboard → Export → "Full Backup (JSON)".

**Import via Supabase Dashboard:**
1. Öffne SQL Editor
2. Für jede Tabelle:

```sql
-- Beispiel für 'profiles' Tabelle
INSERT INTO profiles (id, user_id, display_name, city, canton, ...)
VALUES 
  ('...', '...', '...', '...', '...'),
  ('...', '...', '...', '...', '...');
```

**Tipp:** Nutze ein Tool wie [supabase-js](https://supabase.com/docs/reference/javascript/insert) für Batch-Inserts.

#### 4.2 Storage-Dateien (Fotos, Assets)

Exportiere Storage-Index via Admin-Export → "Storage Index (JSON)".

**Manueller Upload:**
1. Supabase Dashboard → Storage
2. Erstelle Buckets:
   - `profile-photos` (public)
   - `site-assets` (public)
   - `advertisements` (public)
   - `verification-photos` (private)
3. Lade Dateien aus deinem alten Backend manuell hoch

**Programmatischer Upload (empfohlen):**

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient('YOUR_URL', 'YOUR_SERVICE_ROLE_KEY');

async function uploadFiles() {
  const files = fs.readdirSync('./local-photos');
  
  for (const file of files) {
    const fileBuffer = fs.readFileSync(`./local-photos/${file}`);
    await supabase.storage
      .from('profile-photos')
      .upload(file, fileBuffer, { contentType: 'image/jpeg' });
  }
}
```

---

### 5. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei:

```env
VITE_SUPABASE_URL=https://DEIN_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=DEIN_PROJECT_ID
```

**Optional (für Stripe-Zahlungen):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

### 6. Edge Functions deployen

Alle Backend-Logik befindet sich in `supabase/functions/`.

```bash
# Alle Functions deployen
supabase functions deploy check-auth-rate-limit
supabase functions deploy check-leaked-password
supabase functions deploy check-subscription-expiry
supabase functions deploy cleanup-orphaned-photos
supabase functions deploy delete-user-account
supabase functions deploy export-user-data
supabase functions deploy generate-sitemap
supabase functions deploy geocode-all-profiles
supabase functions deploy log-error
supabase functions deploy record-auth-attempt
supabase functions deploy track-ad-event
supabase functions deploy track-event
supabase functions deploy track-profile-view
supabase functions deploy validate-image

# Secrets für Edge Functions setzen (falls benötigt)
supabase secrets set OPENAI_API_KEY=sk-...
```

---

### 7. Frontend bauen & deployen

#### Option A: Vercel (empfohlen)
```bash
npm run build
vercel --prod
```

#### Option B: Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

#### Option C: Eigener Server (nginx)
```bash
npm run build

# dist/ Ordner auf Server hochladen
# nginx config:
server {
  listen 80;
  server_name escoria.ch;
  
  location / {
    root /var/www/escoria/dist;
    try_files $uri $uri/ /index.html;
  }
}
```

---

## 🔐 Sicherheits-Checkliste

- [ ] Row Level Security (RLS) auf allen Tabellen aktiviert
- [ ] Service Role Key niemals im Frontend verwenden
- [ ] CORS richtig konfiguriert in Supabase
- [ ] Auth-Provider aktiviert (Email + Password)
- [ ] Confirm Email deaktiviert für Produktion (oder SMTP konfiguriert)
- [ ] Storage Policies korrekt gesetzt (public/private)
- [ ] Rate Limiting für Auth aktiviert
- [ ] SSL/HTTPS für Domain aktiviert

---

## 📊 Post-Migration Tests

1. **Auth testen:**
   - Registrierung
   - Login
   - Passwort-Reset

2. **Profile testen:**
   - Profil erstellen
   - Foto hochladen
   - Profil bearbeiten
   - Suche testen

3. **Admin testen:**
   - Admin-Login
   - Profile aktivieren/deaktivieren
   - Banner verwalten
   - Export-Funktionen

4. **Zahlungen testen:**
   - Stripe Test-Modus aktivieren
   - Test-Payment durchführen

---

## 🆘 Troubleshooting

### "Invalid API Key"
→ Überprüfe `.env` Datei und `VITE_SUPABASE_PUBLISHABLE_KEY`

### "Row Level Security Policy Violation"
→ Führe RLS-Policies aus Migrations aus: `supabase/migrations/XXXXXX_rls_policies.sql`

### "Storage Access Denied"
→ Überprüfe Storage Policies in Supabase Dashboard

### "Edge Function Timeout"
→ Erhöhe Timeout in `supabase/functions/FUNCTION_NAME/index.ts`:
```typescript
Deno.serve({ 
  handler: async (req) => { ... },
  timeout: 60000  // 60 Sekunden
});
```

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **React Router:** https://reactrouter.com
- **Vite:** https://vitejs.dev
- **GitHub Issues:** [Link zu deinem Repo]

---

## 🔄 Continuous Deployment

### GitHub Actions Setup

Erstelle `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📝 Wichtige Hinweise

1. **Backup vor Migration:** Exportiere ALLE Daten über Admin-Dashboard
2. **DNS-Änderungen:** Plane 24-48h für DNS-Propagation ein
3. **Downtime:** Plane 1-2 Stunden Wartungsfenster ein
4. **Testing:** Teste auf Staging-Umgebung vor Production-Migration
5. **Monitoring:** Nutze Supabase Dashboard für Echtzeit-Monitoring

---

## ✅ Erfolgreiche Migration

Nach erfolgreicher Migration solltest du:
- [ ] Alle Seiten erreichbar sein
- [ ] Login/Registrierung funktionieren
- [ ] Profile anzeigbar sein
- [ ] Suche funktionieren
- [ ] Admin-Dashboard erreichbar
- [ ] Fotos/Assets laden
- [ ] Zahlungen durchführbar (falls Stripe konfiguriert)

**Glückwunsch! 🎉 Deine Plattform läuft jetzt unabhängig!**
