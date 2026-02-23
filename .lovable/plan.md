
# Make Lat/Lng Required and Show Autocomplete Error

## Changes

### 1. `src/components/profile/ProfileForm.tsx` (Lines ~39-40)

Change lat/lng from optional to required with German error messages:

```diff
- lat: z.number().optional(),
- lng: z.number().optional(),
+ lat: z.number({ required_error: 'Bitte Adresse auswählen' }),
+ lng: z.number({ required_error: 'Bitte Adresse auswählen' }),
```

### 2. `src/components/profile/sections/LocationSection.tsx` (After line 180)

Add error message below the address input when no autocomplete suggestion was selected:

```diff
  {errors.city && (
    <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
  )}
+ {(errors.lat || errors.lng) && (
+   <p className="text-sm text-destructive mt-1">Bitte eine Adresse aus den Vorschlägen wählen</p>
+ )}
```

## Result

- Users must select an address from the Google Places autocomplete suggestions (which sets lat/lng)
- If they type a city manually without selecting a suggestion, form validation will fail and show the error message under the address field
- Existing profiles being edited that already have lat/lng will pass validation as before
