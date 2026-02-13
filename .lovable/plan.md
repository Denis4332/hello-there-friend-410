

# Fix: Slug komplett unveränderlich machen

## Problem
Der Slug (Profil-URL) ändert sich immer noch, wenn Name oder Stadt bearbeitet werden. Der User will aber, dass die URL nach der Erstellung **nie mehr** geändert wird -- es ist ja dasselbe Profil.

Zusätzlich hat der Update-Trigger noch `age` in seiner WHEN-Bedingung, was unnötig ist.

## Lösung

### Datenbank-Migration

1. **Den Update-Trigger komplett entfernen** -- der Slug soll nach dem INSERT nie mehr geändert werden
2. Der Insert-Trigger (`set_profile_slug_insert`) bleibt bestehen und funktioniert wie bisher

```text
Migration SQL:
  DROP TRIGGER IF EXISTS set_profile_slug_update ON public.profiles;
```

Das ist alles. Die Funktion `generate_profile_slug()` kann bleiben (wird noch vom Insert-Trigger gebraucht), aber der Update-Trigger wird entfernt.

### Was sich ändert
- Profil-URL wird einmalig bei der Erstellung generiert und bleibt dann für immer gleich
- Egal ob Name, Stadt, Alter oder sonst was geändert wird: die URL bleibt stabil
- Keine gebrochenen Links, kein SEO-Verlust

### Keine Code-Änderungen nötig
Die Frontend-Logik in ProfileEdit.tsx muss nicht angepasst werden.

