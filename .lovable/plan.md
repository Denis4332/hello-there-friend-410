

# Fix: E-Mail-Bestaetigungshinweis nach Registrierung + Cold-Start-Optimierung

## Problem 1: Bestaetigungshinweis nicht sichtbar

Nach der Registrierung wird nur ein kurzer Toast (kleine Benachrichtigung unten rechts) angezeigt, der leicht uebersehen wird. Der User merkt nicht, dass eine E-Mail-Bestaetigung noetig ist.

**Loesung:** Nach erfolgreicher Registrierung wird statt des Toasts ein deutlich sichtbarer Bestaetigungs-Screen direkt im Formular angezeigt -- mit Briefumschlag-Icon, klarer Anweisung und einem "Zum Login"-Button.

## Problem 2: Cold Starts bei Login/Signup

Beim Login werden bis zu 3 Edge Functions aufgerufen (check-rate-limit, record-attempt, check-leaked-password), die alle Cold Starts haben koennen. Das macht den Prozess sehr langsam.

**Loesung:**
- `recordAttempt` wird non-blocking im Hintergrund ausgefuehrt (kein `await`)
- `check-leaked-password` wird parallel zum Rate-Limit-Check gestartet (nicht sequentiell)
- Login-Flow: `recordAttempt` wird nach der Navigation ausgefuehrt, nicht davor

## Aenderungen

### 1. `src/pages/Auth.tsx` -- Bestaetigungs-Screen + schnellerer Flow

**Bestaetigungs-Screen:**
- Neuer State `showConfirmation` (boolean)
- Nach erfolgreicher Registrierung: `setShowConfirmation(true)` statt nur Toast
- Wenn `showConfirmation === true`: Grosser, sichtbarer Screen mit:
  - Mail-Icon (Lucide `MailCheck`)
  - "Pruefe deinen Posteingang" als Titel
  - Erklaerungstext mit der eingegebenen E-Mail-Adresse
  - "Zum Login"-Button der `showConfirmation` zuruecksetzt und zum Login-Tab wechselt

**Login-Optimierung:**
- `recordAttempt` ohne `await` aufrufen (fire-and-forget)
- Navigation sofort nach erfolgreichem Login, nicht nach recordAttempt

**Signup-Optimierung:**
- `check-leaked-password` und `checkRateLimit` parallel ausfuehren mit `Promise.all`
- `recordAttempt` ohne `await` (fire-and-forget)

### 2. `src/contexts/AuthContext.tsx` -- Non-blocking recordAttempt

- In `signIn`: `recordAttempt` ohne `await` ausfuehren
- In `signUp`: `recordAttempt` ohne `await` ausfuehren
- Die Funktionen laufen im Hintergrund, blockieren aber nicht den User-Flow

## Technische Details

### Bestaetigungs-Screen (in Auth.tsx)

```text
+----------------------------------+
|                                  |
|         [Mail-Icon]              |
|                                  |
|   Pruefe deinen Posteingang      |
|                                  |
|   Wir haben eine E-Mail an       |
|   deine@email.ch gesendet.       |
|   Klicke auf den Link in der     |
|   E-Mail um dein Konto zu        |
|   aktivieren.                    |
|                                  |
|   [    Zum Login    ]            |
|                                  |
+----------------------------------+
```

### Login-Flow vorher vs. nachher

```text
VORHER (langsam):
checkRateLimit (Edge Fn, ~500ms cold)
  -> signIn (Supabase Auth)
    -> await recordAttempt (Edge Fn, ~500ms cold)
      -> navigate

NACHHER (schnell):
checkRateLimit (Edge Fn)
  -> signIn (Supabase Auth)
    -> navigate
    -> recordAttempt (fire-and-forget, non-blocking)
```

### Signup-Flow vorher vs. nachher

```text
VORHER (sequentiell):
checkLeakedPassword (Edge Fn, ~500ms)
  -> checkRateLimit (Edge Fn, ~500ms)
    -> auth-signup (Edge Fn, ~500ms)
      -> await recordAttempt (Edge Fn, ~500ms)

NACHHER (parallel + non-blocking):
[checkLeakedPassword + checkRateLimit] parallel (~500ms total)
  -> auth-signup (Edge Fn)
    -> recordAttempt (fire-and-forget)
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Auth.tsx` | Bestaetigungs-Screen + parallel Checks + non-blocking recordAttempt |
| `src/contexts/AuthContext.tsx` | Non-blocking recordAttempt in signUp |

