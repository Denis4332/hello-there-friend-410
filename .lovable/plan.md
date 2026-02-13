

# Verifizierungsfoto direkt im Profil-Review anzeigen

## Problem
1. Verifizierungsfotos werden auf einem separaten Tab angezeigt. Der Admin muss zwischen "Profile prufen" und "Verifizierungen" hin- und herwechseln.
2. Das Dashboard zeigt "0 Profile, 1 Verifikation" -- das ist korrekt (das Profil existiert und ist aktiv, hat aber eine offene Verifikation). Sobald die Verifikation im Profil-Dialog sichtbar ist, wird das intuitiver.

## Loesung

### Schritt 1: Verifikationsdaten im Profil-Query mitladen
In `AdminProfile.tsx` wird die Profil-Abfrage erweitert, um auch die zugehoerige `verification_submissions` (status = 'pending') mitzuladen. Dazu wird nach dem Laden der Kontaktdaten zusaetzlich die Verifikation abgefragt.

### Schritt 2: Verifikationsfoto im Profil-Detail-Dialog anzeigen
Im "Pruefen"-Dialog eines Profils wird direkt unter den Profilfotos ein neuer Bereich "Verifizierung" eingefuegt:
- Zeigt das Verifizierungsfoto (signierte URL, da privater Bucket)
- Zeigt "Genehmigen" und "Ablehnen" Buttons direkt im Kontext
- Nur sichtbar, wenn eine ausstehende Verifikation existiert
- Badge "Verifizierung ausstehend" in der Profilliste bei Profilen mit offener Verifikation

### Schritt 3: Separaten Verifikations-Tab entfernen
- Den Tab "Verifizierungen" aus der `TabsList` entfernen
- Die `VerificationsTab`-Komponente wird nicht mehr gerendert
- Alles passiert jetzt im Profil-Dialog

### Schritt 4: Dashboard-Zaehler anpassen
Im `AdminDashboard.tsx` den Link "Verifikationen" unter "Zu pruefen" so aendern, dass er direkt zur Profilliste navigiert (statt zu einem separaten Tab).

---

### Technische Details

**AdminProfile.tsx -- Profil-Query erweitern:**
```text
// Nach dem Laden der Kontaktdaten:
const { data: verificationData } = await supabase
  .from('verification_submissions')
  .select('*')
  .eq('profile_id', profile.id)
  .eq('status', 'pending')
  .maybeSingle();

return { ...profile, contact: contactData, pendingVerification: verificationData };
```

**AdminProfile.tsx -- Signierte URL fuer Verifikationsfoto:**
Im Dialog wird fuer Profile mit `pendingVerification` eine signierte URL aus dem `verification-photos` Bucket generiert und das Foto angezeigt.

**AdminProfile.tsx -- Verifikations-Aktionen im Dialog:**
Genehmigen/Ablehnen-Buttons werden direkt im Profil-Dialog implementiert, mit der gleichen Logik wie in `useVerifications.ts` (Status auf approved/rejected setzen, profile.verified_at aktualisieren).

**Profilliste -- Visueller Hinweis:**
Profile mit offener Verifikation erhalten ein Badge oder Icon in der Tabelle, damit der Admin sofort sieht, welche Profile eine Verifikation zu pruefen haben.

**Tab-Entfernung:**
- `TabsList` wird auf nur noch einen Tab reduziert (oder ganz entfernt)
- Import von `VerificationsTab` wird entfernt

