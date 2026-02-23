

# Fix: Approved/Rejected Verifications Showing in "Zu prüfen" Filter

## Root Cause (Confirmed)

Three locations in `src/pages/admin/AdminProfile.tsx` treat any verification submission as "needs review", regardless of whether it was already approved or rejected:

1. **Line 156** - `pendingVerification` is set to the latest verification entry regardless of status (approved, rejected, or pending)
2. **Line 163** - The `needs_review` filter checks `p.pendingVerification` (truthy = exists) instead of checking `p.pendingVerification?.status === 'pending'`
3. **Lines 942-944** - The orange "Pruefen" badge checks `profile.pendingVerification` existence, not `status === 'pending'`

## Changes

### File: `src/pages/admin/AdminProfile.tsx`

**Fix 1 - Line 163**: Filter only profiles with actually pending verifications

```diff
- (p) => p.status === 'pending' || p.pendingVerification
+ (p) => p.status === 'pending' || p.pendingVerification?.status === 'pending'
```

**Fix 2 - Line 942**: Show orange badge only for pending verifications

```diff
- {profile.pendingVerification && (
+ {profile.pendingVerification?.status === 'pending' && (
```

No changes needed to line 156 -- the verification data is still useful for displaying status (approved/rejected) inside the profile dialog. The dialog section (lines 1157+) already correctly checks `selectedProfile.pendingVerification.status` for styling and labels.

## Result

- Only profiles with `status = 'pending'` OR a verification submission with `status = 'pending'` will appear in "Zu pruefen"
- The orange badge will only show for genuinely pending verifications
- Already approved or rejected verifications will no longer clutter the review queue
- The profile detail dialog continues to show verification history with correct color coding

