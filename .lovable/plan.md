
# Sicherheits-Fix: Paket-Änderung für unbezahlte Profile

## Zusammenfassung

**Problem:** User mit unbezahlten Profilen (`payment_status = 'pending'`) können im Dashboard nicht ihr Paket ändern - sie sehen nur "Jetzt bezahlen" ohne Option zur Paketänderung.

**Lösung:** Minimal-invasive Änderung - nur das PaymentMethodModal im UserDashboard erweitern.

---

## Sicherheits-Analyse

### Was ist SICHER (keine Änderung nötig):

| Komponente | Status | Grund |
|------------|--------|-------|
| ProfileCreate.tsx | ✅ Sicher | Medien-Validierung bei Paketauswahl aktiv |
| PayPort-Flow | ✅ Sicher | Zahlung läuft immer über PayPort |
| Database RLS | ✅ Sicher | `payment_status` kann nur via Edge Function auf 'paid' gesetzt werden |

### Was wird geändert:

**Nur `UserDashboard.tsx`** - Das PaymentMethodModal bekommt 3 zusätzliche Props:

```text
┌─────────────────────────────────────────────────────────┐
│ PaymentMethodModal                                      │
├─────────────────────────────────────────────────────────┤
│ + listingType   → Zeigt aktuelles Paket               │
│ + amount        → Zeigt Preis                         │
│ + onChangePackage → Navigiert zu /profil/erstellen    │
└─────────────────────────────────────────────────────────┘
```

---

## Warum das SICHER ist

### Navigation zu `/profil/erstellen`

Wenn User auf "Ändern" klickt, wird er zu ProfileCreate geleitet. Dort passiert automatisch:

1. **Draft-Erkennung** (Zeile 58-74): Bestehendes Profil wird erkannt
2. **Session-Wiederherstellung**: User landet beim `listing-type` Schritt
3. **Medien-Validierung** (Zeile 380-400): Beim Klick auf "Weiter" wird `validateMediaForNewPackage()` aufgerufen
4. **Kein Gratis-Aktivierung möglich**: Zahlung läuft immer über PayPort

### Keine Exploits möglich

| Exploit-Versuch | Schutz |
|-----------------|--------|
| User ändert Paket ohne zu zahlen | ❌ Zahlung läuft über PayPort |
| User lädt zu viele Fotos für Paket | ❌ `validateMediaForNewPackage()` blockiert |
| User manipuliert `payment_status` | ❌ RLS: Nur Edge Function kann 'paid' setzen |

---

## ProfileUpgrade.tsx - Braucht das auch einen Fix?

**Nein, vorerst nicht.** Der ProfileUpgrade ist für bezahlte, aktive Profile gedacht.

Die dort vorhandenen Funktionen (`handleReactivate`, `handleExtend`, `handleDowngrade`) sind ein separates Thema für später - die sind aktuell nur erreichbar wenn man auf `/profil/upgrade` navigiert, was nicht im normalen Flow vorkommt.

Der aktuelle Fix fokussiert nur auf das User-Problem: **Unbezahlte Profile können kein Paket ändern.**

---

## Technische Änderung

**Datei:** `src/pages/UserDashboard.tsx`

**Zeilen 643-647** - PaymentMethodModal erweitern:

Aktuell:
```tsx
<PaymentMethodModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  onSelectMethod={handlePaymentMethodSelect}
/>
```

Neu:
```tsx
<PaymentMethodModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  onSelectMethod={handlePaymentMethodSelect}
  listingType={profile?.listing_type}
  amount={getAmountForListingType(profile?.listing_type || 'basic')}
  onChangePackage={() => {
    setShowPaymentModal(false);
    navigate('/profil/erstellen');
  }}
/>
```

---

## Was passiert nach dem Fix

1. User mit unbezahltem Profil klickt "Jetzt bezahlen"
2. Modal öffnet sich mit:
   - Gewähltes Paket angezeigt (z.B. "Premium - CHF 99")
   - "Ändern" Link sichtbar
3. User kann:
   - **Direkt bezahlen** → PayPort-Flow startet
   - **Auf "Ändern" klicken** → Wird zu `/profil/erstellen` geleitet, Medien-Validierung greift automatisch

---

## Risiko-Bewertung

| Aspekt | Risiko |
|--------|--------|
| Bestehende Flows | ✅ Keine Änderung |
| PayPort-Integration | ✅ Unberührt |
| CMS-Settings | ✅ Unberührt |
| Medien-Limits | ✅ Werden in ProfileCreate validiert |
| Gratis-Exploits | ✅ Nicht möglich (RLS + PayPort) |

**Gesamtrisiko: MINIMAL** - Es wird nur ein UI-Element erweitert, keine Geschäftslogik geändert.
