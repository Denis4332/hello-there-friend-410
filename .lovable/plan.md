

# Plan: Wrap handleUpload in useCallback + Auto-Upload

## Current State
Fixes 1-3 are already correctly implemented:
- VerificationUploader upsert has only 4 fields
- handleSetPrimary has no ensurePendingIfActive
- UserDashboard banner checks `photos.length === 0`

What remains: `handleUpload` is a plain `async` function (line 148), there is no auto-upload `useEffect`, and the manual upload button still exists (lines 519-528).

## Changes to `src/components/profile/PhotoUploader.tsx`

### 1. Wrap `handleUpload` in `useCallback` (line 148)

Change from:
```typescript
const handleUpload = async () => {
```
To:
```typescript
const handleUpload = useCallback(async () => {
```

And close it at line 324 (after the existing `};`):
```typescript
}, [previews, profileId, userId, pendingPrimaryIndex, hasDbPrimary, loadExistingPhotos, onUploadComplete, showSuccess, showError, showCustomError]);
```

### 2. Add auto-upload `useEffect` (after line 324)

```typescript
// Auto-upload when new files are added
useEffect(() => {
  const hasNewFiles = previews.some(p => !p.uploaded && p.file);
  if (hasNewFiles && !uploading) {
    handleUpload();
  }
}, [previews, uploading, handleUpload]);
```

### 3. Remove manual upload button (lines 519-528)

Delete the entire block:
```typescript
{hasUnuploadedFiles && (
  <Button 
    onClick={handleUpload} 
    disabled={uploading}
    className="w-full"
  >
    {uploading ? 'Wird hochgeladen...' : `${previews.filter(p => !p.uploaded).length} Datei(en) hochladen`}
  </Button>
)}
```

## Files to edit
| File | Change |
|------|--------|
| `src/components/profile/PhotoUploader.tsx` | Wrap `handleUpload` in `useCallback`, add auto-upload `useEffect`, remove manual upload button |

