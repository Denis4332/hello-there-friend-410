

# Fix: Approved/Rejected Verifications Showing in "Zu prüfen" Filter

## Root Cause (Confirmed via code search)

Two lines in `src/pages/admin/AdminProfile.tsx` check for the mere existence of `pendingVerification` instead of checking its status:

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

## Result

- Only profiles with `status = 'pending'` OR a verification with `status = 'pending'` appear in "Zu pruefen"
- Orange badge only shows for genuinely pending verifications
- Profile detail dialog (line 1157) is unchanged -- it already checks status correctly
