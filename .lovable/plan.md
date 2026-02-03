# Implementierung abgeschlossen

## Was wurde implementiert

### 1. Datenbank-Erweiterungen
- ✅ Storage Bucket `change-request-media` (privat) mit RLS-Policies
- ✅ Tabelle `change_request_media` für Medien-Tracking mit RLS

### 2. ProfileChangeRequest.tsx (User-Seite)
- ✅ Bild-Upload bei "Fotos ändern" (max 5 Bilder, je 5MB)
- ✅ Bild-Komprimierung vor Upload
- ✅ Vorschau der ausgewählten Bilder
- ✅ Browser-Warnung bei ungesendeten Änderungen
- ✅ Transaktionaler Upload mit Rollback bei Fehler
- ✅ Upload-Fortschrittsanzeige

### 3. AdminChangeRequests.tsx (Admin-Seite)
- ✅ Liste aller Änderungsanfragen mit Filter
- ✅ Bilder via Signed URLs anzeigen
- ✅ Admin-Antwort schreiben
- ✅ Genehmigen / Ablehnen Buttons

### 4. Navigation
- ✅ Neue Route `/admin/change-requests`
- ✅ Schnelllink in AdminDashboard
- ✅ "Aktionen nötig" Link führt jetzt zu Änderungsanfragen
