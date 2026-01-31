

# Fix: "Paket ändern" Button für unbezahlte Profile

## Problem

Im Screenshot ist zu sehen:
- User hat ein TOP-Paket gewählt
- Zahlung ist ausstehend (`payment_status = 'pending'`)
- ABER: Es wird "Inserat verlängern" angezeigt

Das macht keinen Sinn - man kann nicht verlängern, was man nicht bezahlt hat.

## Lösung

Die Button-Logik im Paket-Bereich muss den `payment_status` berücksichtigen:

| payment_status | listing_type | Button |
|----------------|--------------|--------|
| `pending` | egal | **"Paket ändern"** → `/profil/erstellen` |
| `paid` | basic/premium | "Paket upgraden" → `/user/upgrade` |
| `paid` | top | "Inserat verlängern" → `/user/upgrade` |

## Technische Änderung

**Datei:** `src/pages/UserDashboard.tsx`

**Zeilen 435-453** - Aktuelle Logik (FALSCH):

```tsx
{profile.listing_type !== 'top' && (
  <Button onClick={() => navigate('/user/upgrade')} ...>
    Paket upgraden
  </Button>
)}

{profile.listing_type === 'top' && (
  <Button onClick={() => navigate('/user/upgrade')} ...>
    Paket verlängern
  </Button>
)}
```

**Neue Logik (RICHTIG):**

```tsx
{/* Wenn Zahlung ausstehend: "Paket ändern" zeigen */}
{profile.payment_status === 'pending' && (
  <Button 
    onClick={() => navigate('/profil/erstellen')} 
    variant="outline"
    className="w-full"
  >
    Paket ändern
  </Button>
)}

{/* Wenn bezahlt und nicht TOP: Upgrade anbieten */}
{profile.payment_status === 'paid' && profile.listing_type !== 'top' && (
  <Button 
    onClick={() => navigate('/user/upgrade')} 
    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
  >
    <Crown className="h-4 w-4 mr-2" />
    {upgradeButton || 'Paket upgraden'}
  </Button>
)}

{/* Wenn bezahlt und TOP: Verlängern anbieten */}
{profile.payment_status === 'paid' && profile.listing_type === 'top' && (
  <Button 
    onClick={() => navigate('/user/upgrade')} 
    variant="outline"
    className="w-full"
  >
    {extendButton || 'Inserat verlängern'}
  </Button>
)}
```

## Verhalten nach dem Fix

### Vor Zahlung (payment_status = 'pending'):
1. User sieht sein gewähltes Paket (z.B. TOP AD)
2. Button zeigt "Paket ändern"
3. Klick führt zu `/profil/erstellen`
4. Dort kann er das Paket wechseln und zur Zahlung gehen

### Nach Zahlung (payment_status = 'paid'):
1. User sieht sein aktives Paket
2. Basic/Premium → "Paket upgraden" Button
3. TOP → "Inserat verlängern" Button
4. Beide führen zu `/user/upgrade` für bezahlte Upgrades/Verlängerungen

## Zusammenfassung der Änderungen

| Datei | Zeilen | Was wird geändert |
|-------|--------|-------------------|
| `src/pages/UserDashboard.tsx` | 435-453 | Button-Logik nach `payment_status` konditionieren |

## Risiko

**MINIMAL** - Es werden nur UI-Buttons konditioniert. Die eigentliche Zahlungslogik bleibt unberührt. Die Navigation zu `/profil/erstellen` nutzt den bereits existierenden Draft-Detection-Flow mit Medien-Validierung.

