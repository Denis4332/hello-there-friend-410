
# ProfileEdit Fix: Echtes Speichern + Dashboard Navigation verbessern

## Problem 1: Falscher Text & fehlender Save-Trigger
- Text sagt "Alle Änderungen werden automatisch gespeichert" → **FALSCH**
- "Zurück zum Dashboard" navigiert weg OHNE Änderungen zu speichern
- Profil bleibt `active` statt `pending` weil handleFormSubmit nie aufgerufen wird

## Problem 2: Admin Dashboard "Zu prüfen" nicht klickbar
- Einzelne Kategorien (Profile/Verifikationen/Meldungen) nicht direkt anklickbar

---

## Lösung Teil 1: ProfileEdit.tsx komplett überarbeiten

### Footer-Bereich ersetzen (Zeile 564-571)

**Vorher:**
```tsx
<div className="mt-8 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
  <p className="text-sm text-muted-foreground">
    Alle Änderungen werden automatisch gespeichert.
  </p>
  <Button onClick={() => navigate('/mein-profil')}>
    ← Zurück zum Dashboard
  </Button>
</div>
```

**Nachher:**
```tsx
<div className="mt-8 p-4 bg-muted/50 rounded-lg">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Wichtig:</p>
      <p>Klicke auf "Profil aktualisieren" oben, um deine Änderungen zu speichern.</p>
      {isActiveProfile && (
        <p className="text-orange-600 mt-1">
          Nach dem Speichern wird dein Profil erneut geprüft.
        </p>
      )}
    </div>
    <Button 
      variant="outline" 
      onClick={() => navigate('/mein-profil')}
    >
      ← Zurück (ohne Speichern)
    </Button>
  </div>
</div>
```

### Zusätzlich: "Speichern und zurück" Button in ProfileForm

Um es noch klarer zu machen, fügen wir im Footer-Bereich einen zusätzlichen Speicher-Button hinzu der:
1. Das Formular programmatisch submitted
2. Nach erfolgreichem Speichern automatisch zum Dashboard navigiert

**Neue Variante mit beiden Optionen:**
```tsx
<div className="mt-8 p-4 bg-muted/50 rounded-lg">
  <div className="flex flex-col gap-4">
    <div className="text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Hinweis:</p>
      <p>Profildaten werden gespeichert wenn du oben auf "Profil aktualisieren" klickst.</p>
      <p>Foto-Uploads werden sofort gespeichert.</p>
      {isActiveProfile && (
        <p className="text-orange-600 mt-1">
          ⚠️ Nach dem Speichern muss dein Profil erneut geprüft werden.
        </p>
      )}
    </div>
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        variant="outline" 
        onClick={() => navigate('/mein-profil')}
        className="sm:order-1"
      >
        ← Zurück ohne Speichern
      </Button>
    </div>
  </div>
</div>
```

---

## Lösung Teil 2: Admin Dashboard "Zu prüfen" klickbar machen

### AdminDashboard.tsx - "Zu prüfen" Kachel (Zeile 84-116)

**Vorher:** Ganze Kachel ist ein Link
```tsx
<Link to="/admin/profile?status=pending" className="group">
  <div className="bg-card border rounded-xl p-6 min-h-[140px]...">
    ...
    <div>{stats?.toReview.profiles || 0} Profile</div>
    <div>{stats?.toReview.verifications || 0} Verifikationen</div>
    <div>{stats?.toReview.reports || 0} Meldungen</div>
  </div>
</Link>
```

**Nachher:** Einzelne klickbare Zeilen
```tsx
<div className="bg-card border rounded-xl p-6 min-h-[140px] hover:shadow-xl transition-all duration-300 hover:border-orange-500/50">
  <div className="flex items-center justify-between mb-4">
    <div className="p-3 rounded-lg bg-orange-500/10">
      <AlertCircle className="h-6 w-6 text-orange-500" />
    </div>
    <div className="text-3xl font-bold text-orange-500">{stats?.toReview.total || 0}</div>
  </div>
  <div className="text-sm text-muted-foreground font-medium mb-2">Zu prüfen</div>
  <div className="text-xs space-y-1">
    <Link 
      to="/admin/profile?status=pending" 
      className="block text-muted-foreground hover:text-orange-500 hover:underline transition-colors"
    >
      → {stats?.toReview.profiles || 0} Profile
    </Link>
    <Link 
      to="/admin/profile?tab=verifications" 
      className="block text-muted-foreground hover:text-orange-500 hover:underline transition-colors"
    >
      → {stats?.toReview.verifications || 0} Verifikationen
    </Link>
    <Link 
      to="/admin/reports" 
      className="block text-muted-foreground hover:text-orange-500 hover:underline transition-colors"
    >
      → {stats?.toReview.reports || 0} Meldungen
    </Link>
  </div>
</div>
```

---

## Zusammenfassung

| Datei | Änderung |
|-------|----------|
| `ProfileEdit.tsx` | Falschen "Auto-Save" Text entfernen, klare Hinweise stattdessen |
| `ProfileEdit.tsx` | "Zurück ohne Speichern" Button umbenennen |
| `AdminDashboard.tsx` | "Zu prüfen" Kachel mit 3 klickbaren Links |

## Resultat

1. **User weiss jetzt**: Formular muss explizit gespeichert werden
2. **User kann wählen**: Speichern (oben) oder Abbrechen (unten)
3. **Admin Dashboard**: Direkter Zugriff auf Profile, Verifikationen, Meldungen
