
# Hauptfoto wechseln im User-Dashboard

## Problem
Im User-Dashboard werden Fotos angezeigt, aber es gibt keinen Button zum Wechseln des Hauptfotos. Die Stern-Buttons wurden auch aus dem PhotoUploader entfernt. Nutzer koennen ihr Hauptfoto aktuell gar nicht aendern.

## Loesung
Im Fotos-Bereich des UserDashboards wird auf jedem Nicht-Hauptfoto ein Button "Als Hauptfoto setzen" hinzugefuegt. Beim Klick wird:
1. Das alte Hauptfoto auf `is_primary = false` gesetzt
2. Das neue Foto auf `is_primary = true` gesetzt
3. Der Profilstatus wird NICHT geaendert -- das Profil bleibt aktiv

## Umsetzung

### UserDashboard.tsx anpassen

**Neue Funktion `handleSetPrimary`:**
- Nimmt die photo ID entgegen
- Setzt alle Fotos des Profils auf `is_primary = false`
- Setzt das gewaehlte Foto auf `is_primary = true`
- Aktualisiert den lokalen State (`setPhotos`)
- Zeigt einen Erfolgs-Toast

**UI-Aenderung im Fotos-Grid:**
- Jedes Foto bekommt bei Hover einen Button-Overlay
- Hauptfoto: Zeigt weiterhin das "Hauptfoto" Badge
- Nicht-Hauptfoto: Zeigt einen klickbaren Stern-Button "Als Hauptfoto setzen"
- Button ist disabled waehrend der Aktion laeuft

### Technische Details

```text
// Neue Handler-Funktion
const handleSetPrimary = async (photoId: string) => {
  // 1. Alle Fotos des Profils: is_primary = false
  await supabase.from('photos').update({ is_primary: false }).eq('profile_id', profile.id);
  // 2. Gewaehltes Foto: is_primary = true  
  await supabase.from('photos').update({ is_primary: true }).eq('id', photoId);
  // 3. Lokalen State aktualisieren
  // 4. Toast anzeigen
};
```

**Wichtig:** Die `profiles`-Tabelle wird NICHT angefasst. Kein Status-Wechsel zu "pending". Das Hauptfoto ist ein rein kosmetisches Attribut der `photos`-Tabelle.
