

# Make Lat/Lng Required and Show Autocomplete Error

## Changes

### 1. `src/components/profile/ProfileForm.tsx` (Lines 38-39)

Change lat/lng from optional to required with German error messages:

```diff
- lat: z.number().optional(),
- lng: z.number().optional(),
+ lat: z.number({ required_error: 'Bitte Adresse auswählen' }),
+ lng: z.number({ required_error: 'Bitte Adresse auswählen' }),
```

### 2. `src/components/profile/sections/LocationSection.tsx` (Lines 178-181)

Add error message below the address input when no autocomplete suggestion was selected:

```diff
  {errors.city && (
    <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
  )}
+ {(errors.lat || errors.lng) && (
+   <p className="text-sm text-destructive mt-1">Bitte eine Adresse aus den Vorschlägen wählen</p>
+ )}
  </div>
```

## Result

- Users must select an address from Google Places autocomplete (which sets lat/lng)
- Manual city entry without selecting a suggestion triggers validation error
- Existing profiles with lat/lng already set will pass validation

