

# 2 Bugfixes: Verifizierungs-Duplikate + PaymentModal Props

## Fix 1: Verifizierungs-Duplikate verhindern

**Problem:** Wenn ein User ein neues Verifizierungsfoto hochlaedt (z.B. nach Profil-Bearbeitung), wird ein neuer Eintrag in `verification_submissions` erstellt ohne den alten zu loeschen. Im Admin-Dashboard erscheinen dann mehrere Eintraege fuer dasselbe Profil.

**Loesung:** In `VerificationUploader.tsx` vor dem INSERT:
1. Alle bestehenden `pending`-Submissions fuer dieses Profil aus der DB laden
2. Deren Storage-Dateien aus dem `verification-photos` Bucket loeschen
3. Die DB-Eintraege loeschen
4. Erst dann den neuen INSERT + Upload durchfuehren

So existiert immer nur 1 aktive Verifizierungs-Submission pro Profil.

**Datei:** `src/components/profile/VerificationUploader.tsx` (Zeilen 48-69 erweitern)

## Fix 2: PaymentMethodModal in ProfileUpgrade mit Paket-Info

**Problem:** In `ProfileUpgrade.tsx` wird das `PaymentMethodModal` ohne `listingType` und `amount` Props aufgerufen. Der User sieht im Zahlungs-Dialog nicht welches Paket er bezahlt.

**Loesung:** Die fehlenden Props ergaenzen:

```text
<PaymentMethodModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  onSelectMethod={handlePaymentMethodSelect}
  listingType={selectedListingType || undefined}
  amount={selectedListingType ? getAmountForListingType(selectedListingType) : undefined}
/>
```

**Datei:** `src/pages/ProfileUpgrade.tsx` (Zeilen 377-381)

## Betroffene Dateien

- `src/components/profile/VerificationUploader.tsx` - Alte Submissions loeschen vor neuem Upload
- `src/pages/ProfileUpgrade.tsx` - Props an PaymentMethodModal uebergeben

## Risiko

Minimal. Keine DB-Migration noetig. Keine Aenderung an bestehender Business-Logik.

