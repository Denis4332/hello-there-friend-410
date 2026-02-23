

# Phase 4 Fix: dialogVerified aus AdminProfile.tsx entfernen

## Problem

`dialogVerified` State und die zugehoerige Logik sind noch in `AdminProfile.tsx` vorhanden. Dadurch kann der Admin ueber den "Speichern"-Button im Profil-Dialog direkt `verified_at` setzen/entfernen -- das soll aber ausschliesslich ueber den Verifikations-Tab (Approve/Reject von Submissions) laufen.

## Aenderungen in `src/pages/admin/AdminProfile.tsx`

### 1. State entfernen (Zeile 58)

```diff
- const [dialogVerified, setDialogVerified] = useState(false);
+ // Removed: verification only via AdminVerifications tab
```

### 2. setDialogVerified Aufruf entfernen (Zeile 669)

```diff
  setSelectedProfile(profile);
  setDialogStatus(profile.status);
- setDialogVerified(!!profile.verified_at);
  setDialogNote('');
```

### 3. Mutation-Aufruf bereinigen (Zeile 779-786)

`verified: dialogVerified` aus dem `mutate`-Aufruf entfernen:

```diff
  updateProfileMutation.mutate({
    profileId: selectedProfile.id,
    status: dialogStatus,
-   verified: dialogVerified,
    note: dialogNote,
    listingType: dialogListingType,
    expiryDate: dialogExpiryDate
  });
```

### 4. Mutation-Interface und -Logik bereinigen (Zeilen 172-186)

`verified` aus dem Interface entfernen und die `verified_at`-Zeile aus dem Update-Objekt entfernen:

```diff
  mutationFn: async (data: {
    profileId: string;
    status: string;
-   verified: boolean;
    note?: string;
    listingType: string;
    expiryDate?: string;
  }) => {
    const updates: any = {
      status: data.status,
-     verified_at: data.verified ? new Date().toISOString() : null,
      listing_type: data.listingType
    };
```

## Ergebnis

- `verified_at` wird nicht mehr ueber den Profil-Dialog gesetzt
- Verifikation laeuft ausschliesslich ueber den Verifikations-Bereich (Approve/Reject von Submissions), der bereits im Dialog eingebaut ist (Zeilen 1160-1230) und ueber `approveVerificationMutation` funktioniert
- Keine UI-Aenderung noetig -- es gibt keine sichtbare Checkbox, nur die State-Variable und ihre Verwendung in der Mutation

