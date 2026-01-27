
Ziel
- 100% sicherstellen, dass überall (Live + Admin) das gleiche Favicon verwendet wird: das von dir hochgeladene “zwei rote Herzen”-Icon.
- Gleichzeitig den aktuellen Blank-Screen/Fehler “No QueryClient set” zuverlässig beheben (der blockiert sonst alles und macht das Favicon-Testen unnötig schwer).

Was ich bereits verifiziert habe (Live)
- Auf der Live-Domain sind diese Dateien erreichbar (Status OK):
  - /favicon-hearts.png
  - /apple-touch-icon-hearts.png
  - /pwa-192-hearts.png
- Das bedeutet: Die “hearts”-Assets sind live grundsätzlich vorhanden. Wenn du trotzdem irgendwo ein anderes Icon siehst, ist das typischerweise Cache/PWA/Manifest/Browser-Icon-Cache – oder ein altes zusätzliches Favicon/Manifest wird noch referenziert.

Problem 1: Du willst “ja/nein” – aber Favicons sieht man nicht zuverlässig in normalen Screenshots
Warum das so ist
- Ein Favicon wird im Browser-Tab, Lesezeichen, iOS Home-Screen (Apple Touch Icon), PWA-Installationsicon und teils im Cache gespeichert.
- Ein Screenshot der Seite zeigt nicht den Tab-Favicon-Cache.
Lösung
- Wir bauen eine Debug-Seite, die die aktuell verwendeten Icon-Dateien groß anzeigt (nicht im Tab, sondern als normale Bilder im Content). Dann kannst du sofort visuell “ja/nein” bestätigen, ohne Browser-Cache-Raten.

Problem 2: Runtime Error “No QueryClient set, use QueryClientProvider”
Was ich im Code sehe
- In src/App.tsx ist QueryClientProvider vorhanden und umschließt SiteSettingsProvider:
  - <QueryClientProvider client={queryClient}>
      <SiteSettingsProvider> … </SiteSettingsProvider>
    </QueryClientProvider>
- useBatchSiteSettings() nutzt useQuery() und wird in SiteSettingsProvider aufgerufen.
- Trotzdem kommt der Fehler in der Preview. Das spricht stark für ein “Provider wird bei Hot-Reload/Remount nicht sauber aufgebaut” oder für “App wird in manchen Situationen gerendert, bevor der Provider steht” (z.B. durch HMR/StrictMode Doppel-Render, oder Provider sitzt zu tief).

Technisch robuste Fix-Strategie (für QueryClient-Fehler)
- QueryClientProvider so hoch und stabil wie möglich platzieren: in src/main.tsx (Root-Level), damit:
  - es bei HMR weniger wahrscheinlich ist, dass Hooks “ohne Provider” laufen
  - Provider-Reihenfolge klar ist (QueryClientProvider -> SiteSettingsProvider -> App)
- QueryClient-Instanz in ein eigenes Modul auslagern (z.B. src/lib/queryClient.ts), damit sie nicht bei jedem Hot-Reload neu erzeugt wird.
- Optional (aber empfehlenswert): ReactQueryDevtools nicht nötig; wir halten es minimal.

Favicon “ein für alle Mal” fixieren (und alte Icons entschärfen)
1) Single Source of Truth
- index.html muss ausschließlich auf:
  - /favicon-hearts.png
  - /apple-touch-icon-hearts.png
  - (und optional) /site.webmanifest (falls vorhanden/benutzt)
- Keine alten v1/v2 Links mehr (auch nicht als Kommentar), damit Browser nicht “irgendwas anderes” pickt.

2) PWA/Manifest-Konsistenz
- VitePWA manifest icons müssen ausschließlich auf:
  - /pwa-192-hearts.png
  - /pwa-512-hearts.png
- includeAssets muss ebenfalls nur hearts-Dateien enthalten.

3) “Alte Dateien weg” (ohne Risiko)
- In public/ existieren möglicherweise noch alte favicon*.png/v2-Assets.
- Technisch “wegmachen” heißt:
  - Entfernen der alten Dateien aus public/ (damit beim nächsten Publish wirklich nur hearts existieren).
  - Oder (wenn du sie behalten willst): Sicherstellen, dass nirgendwo mehr darauf verwiesen wird.
- Da du ausdrücklich “mach die anderen einfach weg” willst, plane ich: alte favicon-v2.png / favicon.png / pwa-*-v2.png etc. entfernen, sofern sie nicht mehr referenziert werden. (Wir prüfen References per Code-Search, dann löschen.)

4) Debug-Seite für klare Ja/Nein-Verifizierung
- Neue Route z.B. /debug/icons (nur für dich, kann später wieder entfernt werden), die anzeigt:
  - <img src="/favicon-hearts.png" style="width:256px;height:256px" />
  - <img src="/apple-touch-icon-hearts.png" style="width:256px;height:256px" />
  - <img src="/pwa-192-hearts.png" style="width:256px;height:256px" />
  - <img src="/pwa-512-hearts.png" style="width:256px;height:256px" />
- Zusätzlich ein kurzer Text “Wenn diese vier Bilder korrekt sind, ist das Favicon korrekt deployed – alles andere ist nur Cache/PWA-Installationscache.”

5) Admin-Check
- Admin läuft im gleichen Frontend (gleiche index.html), daher sollte er automatisch das gleiche Favicon nutzen.
- Der häufigste Grund, warum Admin “anders” wirkt:
  - Browser hat für /admin bereits ein altes Icon gecached (selten getrennt pro Path, aber möglich je nach Browser)
  - oder PWA/Home-Screen Icon kommt aus “Installationszeitpunkt” und ändert sich nicht ohne Neuinstallation.
- Mit der Debug-Seite kann man im Admin-Kontext sofort prüfen.

Testplan (damit es nicht mehr “gefühlt” ist)
- Nach Implementierung:
  1) Preview: /debug/icons öffnen -> du bestätigst: “Ja, das sind die zwei roten Herzen”.
  2) Live: /debug/icons öffnen -> du bestätigst: “Ja, auch live”.
  3) Wenn Tab-Icon trotzdem falsch:
     - Desktop: Hard reload
     - Wenn PWA installiert: App löschen und neu installieren (PWA/Home Screen icons aktualisieren sich oft nicht automatisch)
     - iOS: Safari Website-Daten für Domain löschen + ggf. Home-Screen Icon neu hinzufügen

Wichtige Nebenbedingung aus deinem Projekt (“Inserate müssen öffentlich sein”)
- Das bleibt so: Inserate/Anzeigen sollen für nicht eingeloggte User sichtbar sein.
- Wir ändern dafür an dieser Stelle nichts am Backend; die Favicon/Provider-Änderungen betreffen nur Frontend/Assets.

Umfang der Änderungen (konkret)
- src/main.tsx: QueryClientProvider + SiteSettingsProvider (und ggf. AuthProvider) in eine stabile Provider-Kette auf Root verschieben.
- src/App.tsx: Provider entfernen/vereinfachen, damit nichts doppelt ist.
- Neuer helper: src/lib/queryClient.ts (stabile QueryClient-Instanz).
- Neue Debug-Route/Page: src/pages/DebugIcons.tsx (oder ähnlich) + Route in App-Router.
- public/: alte favicon/pwa Assets entfernen, nur hearts-Versionen behalten.
- index.html + vite.config.ts final prüfen: nur hearts-Dateinamen referenzieren.

Risiken / Edge Cases
- Service Worker/PWA kann alte Assets aggressiv cachen. Daher Debug-Seite + (optional) PWA cache version bump über Build ist wichtig.
- iOS Home-Screen Icons bleiben manchmal “statisch” bis Neu-Hinzufügen.
- Wenn du eine eigene Domain (escoria.ch) auf die Lovable Live-Domain zeigst: ja, Inhalt ist gleich, aber Caches können pro Domain separat sein. Das Debug-Endpoint hilft auf beiden Domains.

Ergebnisdefinition (klar)
- Wenn /debug/icons auf Live die richtigen Herzen zeigt: Deployment ist korrekt.
- Wenn Tab/Icon trotzdem falsch: es ist reiner Geräte-/Browser-/PWA-Cache und nicht mehr ein Code/Deployment-Problem.
