

# Bug Fix Plan (7 remaining fixes)

Bugs 8 (PLZ optional) and 9 (Mein Standort) are already resolved from previous edits. Here are the 7 remaining fixes:

## 1. Verification RLS Error
**File:** `src/components/profile/VerificationUploader.tsx` (lines 143-151)

Remove `reviewed_at: null`, `reviewed_by: null`, `admin_note: null` from the upsert object. These fields trigger RLS violations because users don't have permission to set admin-only columns.

**Before:**
```typescript
{
  profile_id: profileId,
  storage_path: filePath,
  status: 'pending',
  submitted_at: new Date().toISOString(),
  reviewed_at: null,
  reviewed_by: null,
  admin_note: null,
}
```

**After:**
```typescript
{
  profile_id: profileId,
  storage_path: filePath,
  status: 'pending',
  submitted_at: new Date().toISOString(),
}
```

---

## 2. ProfileEdit loses lat/lng
**File:** `src/pages/ProfileEdit.tsx`

Two changes:

**a) Add lat/lng to defaultValues** (around line 389-405):
Add `lat: profile.lat || undefined` and `lng: profile.lng || undefined` to the `defaultValues` object.

**b) Add lat/lng to the .update() call** (around line 183-196):
Add `lat: data.lat || null` and `lng: data.lng || null` to the profile update object.

---

## 3. Hauptfoto error (handleSetPrimary)
**File:** `src/pages/ProfileEdit.tsx` (line 328)

Remove `await ensurePendingIfActive()` from `handleSetPrimary` only. Keep `loadData()` call. The ensurePendingIfActive causes errors during the primary photo update flow.

---

## 4. Photo delete not working
**File:** `src/components/profile/PhotoUploader.tsx` (lines 324-339)

Make `removePreview` async. Before calling `setPreviews`, check if the photo is already uploaded and has a DB ID -- if so, delete it from the database first:

```typescript
const removePreview = async (index: number) => {
  const preview = previews[index];
  if (preview.uploaded && preview.id) {
    await supabase.from('photos').delete().eq('id', preview.id);
  }
  setPreviews(prev => {
    // ... existing filter logic
  });
};
```

---

## 5. Photos only show after page reload
**File:** `src/components/profile/PhotoUploader.tsx`

- Extract `loadExistingPhotos` from the `useEffect` (lines 52-87) into a standalone `useCallback`
- After successful upload (around line 316), call `await loadExistingPhotos()` to refresh the photo list immediately

---

## 6. "Unvollstandig" badge wrong
**File:** `src/pages/UserDashboard.tsx` (lines 339-353)

Instead of showing the incomplete banner purely based on `profile.status === 'draft'`, add a photo count query in `loadProfile` and only show the banner when `photoCount === 0`:

```typescript
const { count: photoCount } = await supabase
  .from('photos')
  .select('*', { count: 'exact', head: true })
  .eq('profile_id', profileData.id);
```

Store `photoCount` in state and conditionally show the banner.

---

## 7. PLZ not required (minor tweak)
**File:** `src/components/profile/ProfileForm.tsx` (line 28)

Add `.default('')` to the postal_code validation:

```typescript
postal_code: z.string().optional().default(''),
```

---

## Summary of files to edit

| File | Changes |
|------|---------|
| `src/components/profile/VerificationUploader.tsx` | Remove 3 admin-only fields from upsert |
| `src/pages/ProfileEdit.tsx` | Add lat/lng to defaultValues and update call; remove ensurePendingIfActive from handleSetPrimary |
| `src/components/profile/PhotoUploader.tsx` | Make removePreview async with DB delete; extract loadExistingPhotos as useCallback |
| `src/pages/UserDashboard.tsx` | Add photo count query; conditionally show incomplete banner |
| `src/components/profile/ProfileForm.tsx` | Add .default('') to postal_code |

