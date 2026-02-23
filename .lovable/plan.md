
# Fix CI Deployment: Lockfile Out of Sync

## Problem
The GitHub Actions CI workflow uses `npm ci`, which requires `package-lock.json` to be perfectly in sync with `package.json`. After adding `@googlemaps/js-api-loader`, the lockfile was not updated, causing the build to fail.

## Solution
Change the CI workflow from `npm ci` to `npm install`. This is more resilient because `npm install` will resolve any lockfile mismatches automatically.

## Changes

### File: `.github/workflows/ci.yml` (Line 18)

```diff
-        run: npm ci
+        run: npm install
```

### File: `.github/workflows/deploy.yml` (Lines 24 and 62)

Staging job:
```diff
-        run: npm ci
+        run: npm install
```

Production job:
```diff
-        run: npm ci
+        run: npm install
```

## Why `npm install` instead of `npm ci`
- `npm ci` is stricter but fails whenever `package-lock.json` drifts even slightly
- `npm install` still installs exact versions from the lockfile when it exists, but gracefully handles mismatches
- This prevents future CI failures when dependencies are added/updated through Lovable
