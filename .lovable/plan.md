

# Fix: E-Mail-Verifizierung + Registrierungs-Lock

## Was wird gefixt

**Problem 1:** User werden bei Registrierung sofort bestaetigt und koennen mit Fake-E-Mails Profil erstellen.

**Problem 2:** RESEND_API_KEY Secret-Name ist jetzt korrekt konfiguriert -- E-Mails sollten funktionieren.

## Aenderungen

### 1. `supabase/functions/auth-signup/index.ts`
- `email_confirm` von `true` auf `false` aendern
- Nach User-Erstellung: `send-auth-email` aufrufen um Bestaetigungs-Mail zu senden
- Antwort aendern auf `{ success: true, requires_confirmation: true }`

### 2. `src/pages/Auth.tsx` (Zeilen 205-239)
- Auto-Login nach Signup entfernen (`signIn(email, password)` + `navigate`)
- Stattdessen: Toast "Pruefe deinen Posteingang und bestaetige deine E-Mail-Adresse"
- Tab auf "login" zuruecksetzen
- Kein Redirect mehr nach Signup

## Ablauf nach dem Fix

```text
User registriert sich
    |
    v
Edge Function erstellt User (email_confirm: false)
    |
    v
Bestaetigungs-Mail wird via Resend gesendet
    |
    v
Frontend zeigt: "Pruefe deinen Posteingang"
    |
    v
User klickt Link in Mail --> E-Mail bestaetigt
    |
    v
User kann sich einloggen --> Zugang zu /profil/erstellen
```

## Sicherheit

- Ohne E-Mail-Bestaetigung kein Login moeglich
- Login-Fehler "Email not confirmed" ist bereits in Auth.tsx (Zeile 116) abgefangen
- `/profil/erstellen` bleibt durch `UserProtectedRoute` geschuetzt
- Bestehende User sind nicht betroffen (bereits bestaetigt)

## Technische Details

### auth-signup Aenderung
```text
// VORHER:
email_confirm: true

// NACHHER:
email_confirm: false

// NEU: Nach Erstellung Mail senden
await fetch(`${SUPABASE_URL}/functions/v1/send-auth-email`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
  body: JSON.stringify({ type: "signup_confirmation", email })
});
```

### Auth.tsx Aenderung (Zeilen 205-239)
```text
// ENTFERNEN:
signIn(email, password) + navigate('/profil/erstellen')

// NEU:
toast({ title: 'Registrierung erfolgreich!',
  description: 'Bitte pruefe deinen Posteingang und bestaetige deine E-Mail-Adresse.'
});
setActiveTab('login');
setIsSubmitting(false);
```

## Was sich NICHT aendert
- Login-Flow bleibt gleich
- Passwort-Reset bleibt gleich
- Rotation, SEO, Admin, Subscription -- alles unveraendert

