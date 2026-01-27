/**
 * Debug page to visually verify favicon assets.
 * Route: /debug/icons
 * 
 * If these images show the "two red hearts" logo, the deployment is correct.
 * Any wrong tab icon after this is purely browser/PWA cache.
 */
const DebugIcons = () => {
  const icons = [
    { src: "/favicon-hearts.png", label: "Favicon (Tab Icon)" },
    { src: "/apple-touch-icon-hearts.png", label: "Apple Touch Icon (iOS)" },
    { src: "/pwa-192-hearts.png", label: "PWA Icon 192x192" },
    { src: "/pwa-512-hearts.png", label: "PWA Icon 512x512" },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          🔍 Favicon Debug-Seite
        </h1>
        
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-8">
          <p className="text-foreground mb-2">
            <strong>Anleitung:</strong> Wenn alle vier Bilder unten die "zwei roten Herzen" zeigen, 
            ist das Favicon korrekt deployed.
          </p>
          <p className="text-muted-foreground text-sm">
            Falls dein Browser-Tab trotzdem ein anderes Icon zeigt, ist das nur Cache. 
            Lösung: <code className="bg-background px-1 rounded">Ctrl+Shift+R</code> (Hard Reload) 
            oder bei PWA: App deinstallieren und neu installieren.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {icons.map((icon) => (
            <div 
              key={icon.src} 
              className="bg-card border border-border rounded-lg p-4 flex flex-col items-center"
            >
              <img
                src={icon.src}
                alt={icon.label}
                className="w-32 h-32 object-contain mb-3 bg-white rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="%23f00" width="128" height="128"/><text x="50%" y="50%" fill="white" text-anchor="middle" dy=".3em">ERROR</text></svg>';
                }}
              />
              <span className="text-sm text-muted-foreground text-center">
                {icon.label}
              </span>
              <code className="text-xs text-primary mt-1 break-all">
                {icon.src}
              </code>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <h2 className="font-semibold text-foreground mb-2">✅ Erwartetes Ergebnis</h2>
          <p className="text-muted-foreground">
            Alle vier Bilder sollten das gleiche Icon zeigen: <strong>Zwei rote Herzen</strong> 
            (das Logo, das du hochgeladen hast).
          </p>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/" 
            className="text-primary hover:underline"
          >
            ← Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
};

export default DebugIcons;
