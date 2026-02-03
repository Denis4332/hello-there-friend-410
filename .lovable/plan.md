

# Plan: Strikte Zugangskontrolle + Upgrade/Downgrade Logik

## Übersicht

Nach Freischaltung eines Profils:
- **Upgrade** (z.B. Basic → Premium → TOP): Jederzeit möglich
- **Downgrade** (z.B. TOP → Basic): Erst nach Ablauf des aktuellen Pakets

Nach jeder Paketänderung mit Zahlung → Status zurück auf `pending` → Admin muss erneut prüfen

---

## Logik-Matrix

| Aktion | Aktives Profil | Nach Ablauf |
|--------|----------------|-------------|
| Basic → Premium | ✅ Sofort möglich | ✅ Möglich |
| Basic → TOP | ✅ Sofort möglich | ✅ Möglich |
| Premium → TOP | ✅ Sofort möglich | ✅ Möglich |
| Premium → Basic | ❌ Erst nach Ablauf | ✅ Möglich |
| TOP → Premium | ❌ Erst nach Ablauf | ✅ Möglich |
| TOP → Basic | ❌ Erst nach Ablauf | ✅ Möglich |

---

## Technische Änderungen

### 1. ProfileCreate.tsx - Aktive Profile blockieren

In `checkExistingProfile()` (ca. Zeile 67):

```typescript
// Aktive Profile → Kein Zugang zum normalen Erstellungsflow
if (existingProfile.status === 'active') {
  toast({
    title: 'Profil bereits aktiv',
    description: 'Änderungen nur über "Änderung anfragen" möglich. Für Upgrades nutze den Upgrade-Button im Dashboard.',
    variant: 'destructive',
  });
  navigate('/mein-profil');
  return;
}
```

### 2. ProfileUpgrade.tsx - Upgrade-Only für aktive Profile

Komplette Überarbeitung der Logik:

```typescript
// Paket-Hierarchie für Upgrade-Check
const PACKAGE_RANK = { basic: 1, premium: 2, top: 3 };

const isUpgrade = (from: string, to: string) => {
  return PACKAGE_RANK[to] > PACKAGE_RANK[from];
};

// Bei aktivem Profil: Nur Upgrades anzeigen
if (profile?.status === 'active') {
  // Filtere Pakete - nur höherwertige anzeigen
  const availablePackages = packages.filter(pkg => 
    isUpgrade(profile.listing_type, pkg.id)
  );
  
  if (availablePackages.length === 0) {
    // Schon TOP → Kein Upgrade möglich
    return <InfoCard>Du hast bereits das höchste Paket (TOP).</InfoCard>;
  }
  
  // Zeige nur Upgrade-Optionen
  return <UpgradeSelection packages={availablePackages} />;
}

// Bei inaktivem Profil: Alle Pakete anzeigen (Reaktivierung)
// Bei pending: Alle Pakete anzeigen
```

### 3. Nach Upgrade-Zahlung: Status zurücksetzen

In der Zahlungs-Callback-Logik (`ZahlungErfolg.tsx` oder Edge Function):

```typescript
// Nach erfolgreicher Upgrade-Zahlung
await supabase
  .from('profiles')
  .update({
    listing_type: newPackage,
    payment_status: 'paid',
    status: 'pending',  // WICHTIG: Zurück auf pending für Admin-Review
    premium_until: calculateNewExpiry(newPackage),
  })
  .eq('id', profileId);
```

### 4. UserDashboard.tsx - Button-Logik anpassen

```typescript
{/* AKTIV + BEZAHLT */}
{profile.status === 'active' && profile.payment_status === 'paid' && (
  <>
    {/* Upgrade-Button nur wenn nicht schon TOP */}
    {profile.listing_type !== 'top' && (
      <Button onClick={() => navigate('/user/upgrade')}>
        <ArrowUpCircle className="h-4 w-4 mr-2" />
        Paket upgraden
      </Button>
    )}
    
    {/* Info für Downgrade */}
    <p className="text-xs text-muted-foreground">
      Downgrade erst nach Ablauf am {formatDate(profile.premium_until)} möglich
    </p>
  </>
)}

{/* INAKTIV (abgelaufen) */}
{profile.status === 'inactive' && (
  <Button onClick={() => navigate('/user/upgrade')}>
    <RefreshCw className="h-4 w-4 mr-2" />
    Inserat reaktivieren
  </Button>
)}

{/* PENDING mit pending payment */}
{profile.status !== 'active' && profile.payment_status === 'pending' && (
  <Button 
    variant="outline"
    onClick={() => navigate('/profil/erstellen?step=listing-type')}
  >
    Paket ändern
  </Button>
)}
```

---

## Flow-Diagramm: Upgrade bei aktivem Profil

```text
┌─────────────────────────────────────────────────────────────┐
│  User Dashboard                                             │
│  ─────────────                                              │
│  Status: AKTIV | Paket: Premium | Gültig bis: 15.03.2026   │
│                                                             │
│  [🔼 Paket upgraden]                                        │
│  ↳ Downgrade erst nach Ablauf möglich                       │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  /user/upgrade                                              │
│  ─────────────                                              │
│  Verfügbare Upgrades:                                       │
│                                                             │
│  [○ TOP AD - CHF 150]  ← Nur höhere Pakete sichtbar        │
│                                                             │
│  Premium (dein aktuelles Paket) - nicht wählbar            │
│  Basic - nicht verfügbar (Downgrade)                        │
│                                                             │
│  [Weiter zur Zahlung]                                       │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Zahlung erfolgreich                                        │
│  ──────────────────                                         │
│                                                             │
│  ✅ Dein Upgrade auf TOP AD wurde bezahlt!                  │
│                                                             │
│  Was passiert jetzt:                                        │
│  1. Dein Profil wird erneut geprüft                         │
│  2. Nach Freigabe wird dein TOP AD aktiv                    │
│  3. Laufzeit wird entsprechend angepasst                    │
│                                                             │
│  Status: WARTE AUF FREIGABE                                 │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                            │
│  ───────────────                                            │
│  Neue Anfrage: [Maria] Premium → TOP AD                     │
│                                                             │
│  [✅ Freigeben]  [❌ Ablehnen]                              │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  User Dashboard (nach Freigabe)                             │
│  ─────────────                                              │
│  Status: AKTIV | Paket: TOP AD | Gültig bis: 15.03.2026    │
│                                                             │
│  🎉 Dein TOP AD ist jetzt live!                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Zu ändernde Dateien

| Datei | Änderung |
|-------|----------|
| `ProfileCreate.tsx` | Redirect bei `status === 'active'` |
| `ProfileUpgrade.tsx` | Nur Upgrades bei aktiv, alle bei inaktiv |
| `UserDashboard.tsx` | Upgrade-Button + Downgrade-Info |
| `ZahlungErfolg.tsx` | Status auf `pending` setzen nach Upgrade |

---

## Vorteile dieser Lösung

1. **Upgrade jederzeit**: User kann mehr zahlen, kein Problem
2. **Downgrade geschützt**: Media-Limits werden nicht verletzt
3. **Admin-Kontrolle**: Nach jeder Paketänderung erneute Prüfung
4. **Kein Cheaten**: System kann nicht ausgetrickst werden
5. **Klar für User**: Deutliche Info was möglich ist und was nicht

