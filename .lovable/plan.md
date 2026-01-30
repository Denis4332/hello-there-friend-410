

# Implementierungsplan: Visuelle Verbesserungen

## Harte Regeln - UNANTASTBAR

| Bereich | Status |
|---------|--------|
| Banner-System (BannerDisplay, BannerManager, PopupBanner) | ❌ NICHT ANFASSEN |
| Banner-Aussehen (CSS, Layout) | ❌ NICHT ANFASSEN |
| 3-Sekunden Ad-Timer (3000ms) | ❌ NICHT ANFASSEN |
| Ad-Event-Queue (adEventQueue.ts) | ❌ NICHT ANFASSEN |
| Inserat-Aussehen (ProfileCard.tsx) | ❌ NICHT ANFASSEN |
| Rotation-Algorithmus (profileUtils.ts) | ❌ NICHT ANFASSEN |
| Rotation-Key (useRotationKey.ts) | ❌ NICHT ANFASSEN |
| Sortierung TOP > Premium > Basic | ❌ NICHT ANFASSEN |
| GPS-Suche, Filter, Pagination | ❌ NICHT ANFASSEN |
| Payment-Modal-Workflow Logik | ❌ NICHT ANFASSEN |
| CMS-Settings Hooks | ❌ NICHT ANFASSEN |

---

## Änderungen (nur visuelle/Layout)

### 1. AdminProfile.tsx - Gefahrenzone markieren

**Was:** Den Delete-AlertDialog in einen roten Rahmen einpacken für bessere visuelle Trennung

**Änderung:**
```tsx
<div className="border-t pt-6 mt-6 border-destructive/30">
  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-destructive mb-3">⚠️ Gefahrenzone</h4>
    <!-- bestehendes AlertDialog -->
  </div>
</div>
```

---

### 2. ZahlungErfolg.tsx - Nächste Schritte Liste

**Was:** Strukturierte Liste einfügen die erklärt was nach der Zahlung passiert

**Änderung:** Nach Status-Block, vor Buttons einfügen:
```tsx
{(paymentStatus === 'pending' || paymentStatus === 'paid') && (
  <div className="bg-muted/50 rounded-lg p-4 text-left">
    <h3 className="font-semibold mb-3 text-sm">Was passiert jetzt?</h3>
    <ol className="space-y-2 text-sm text-muted-foreground">
      <li>1. Dein Inserat wird geprüft</li>
      <li>2. Freischaltung in 24h</li>
      <li>3. Bestätigung per E-Mail</li>
    </ol>
  </div>
)}
```

---

### 3. PaymentMethodModal.tsx - Paket-Info anzeigen

**Was:** Optionale Props für Paket-Anzeige + Ändern-Link + Hinweistext

**Änderungen:**
- Props erweitern (optional, rückwärtskompatibel)
- Paket-Info Block vor Zahlungs-Buttons
- Hinweistext am Ende

---

### 4. ProfileCreate.tsx - Zurück-Button + Modal Props

**Was:** 
- Zurück-Button im Verifizierungs-Schritt
- PaymentModal mit Paket-Info aufrufen

**Änderungen:**
- Button "Zurück zu Fotos" vor VerificationUploader
- Modal-Aufruf mit listingType, amount, onChangePackage Props

---

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminProfile.tsx` | Gefahrenzone visuell markieren |
| `src/pages/ZahlungErfolg.tsx` | Nächste Schritte Liste |
| `src/components/PaymentMethodModal.tsx` | Paket-Info + Hinweistext |
| `src/pages/ProfileCreate.tsx` | Zurück-Button + Modal Props |

## Keine Änderungen an Logik oder bestehenden Funktionen

