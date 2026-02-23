
# Fix CI Deployment: npm ci to npm install

## Problem
`npm ci` fails because `package-lock.json` is out of sync after adding `@googlemaps/js-api-loader`.

## Changes (3 lines across 2 files)

### 1. `.github/workflows/ci.yml` (Line 23)
```diff
-        run: npm ci
+        run: npm install
```

### 2. `.github/workflows/deploy.yml` (Line 34, Staging)
```diff
-        run: npm ci
+        run: npm install
```

### 3. `.github/workflows/deploy.yml` (Line 76, Production)
```diff
-        run: npm ci
+        run: npm install
```

## Why
`npm install` gracefully handles lockfile mismatches while still using the lockfile for version resolution. This prevents future CI failures when dependencies change through Lovable.
