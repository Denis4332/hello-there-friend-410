

## Plan: E-Mail-Verifizierung komplett entfernen

### Aktueller Zustand
- `auth-signup` Edge Function erstellt User mit `email_confirm: true` (User ist sofort verifiziert)
- ABER: Es wird trotzdem ein Magic Link per E-Mail gesendet
- User muss auf den Link klicken um sich einzuloggen
- Das verhindert die Nutzung von ungültigen E-Mail-Adressen

### Was geändert wird

#### 1. Edge Function `auth-signup` anpassen
- User wird weiterhin mit `email_confirm: true` erstellt
- **KEIN** Magic Link wird mehr generiert
- **KEINE** E-Mail wird mehr gesendet
- User kann sich direkt nach Registrierung mit E-Mail + Passwort einloggen

#### 2. Frontend `Auth.tsx` anpassen
- Nach erfolgreicher Registrierung: User wird direkt eingeloggt
- Keine "Prüfe deine E-Mail" Nachricht mehr
- Direkter Redirect zu `/profil/erstellen`

### Technische Details

**auth-signup/index.ts:**
- `generateLink()` Aufruf entfernen
- `resend.emails.send()` entfernen
- Nach User-Erstellung: Direkt Session für User generieren und zurückgeben

**Auth.tsx:**
- `registrationSuccess` State entfernen oder umbauen
- Nach erfolgreicher Registrierung: Auto-Login mit den eingegebenen Credentials
- Redirect zu `/profil/erstellen`

### Hinweis
⚠️ Ohne E-Mail-Verifizierung kann jeder beliebige (auch ungültige) E-Mail-Adressen verwenden. Das ist gewollt für Testzwecke, aber für Produktion normalerweise nicht empfohlen.

