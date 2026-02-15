import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sortProfilesByListingType } from '@/lib/profileUtils';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  listing_type: string | null;
  verified_at: string | null;
}

interface RotationDebugToolProps {
  profiles: Profile[];
}

export const RotationDebugTool = ({ profiles }: RotationDebugToolProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Current rotation key (changes every 30 minutes)
  const currentRotationKey = useMemo(() => {
    return Math.floor(Date.now() / (10 * 60 * 1000));
  }, []);

  // Calculate next rotation time
  const nextRotationTime = useMemo(() => {
    const currentKey = Math.floor(Date.now() / (10 * 60 * 1000));
    const nextKeyTimestamp = (currentKey + 1) * (10 * 60 * 1000);
    const nextDate = new Date(nextKeyTimestamp);
    return nextDate.toLocaleTimeString('de-CH', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  // Sort profiles using the same algorithm as the public pages
  const sortedProfiles = useMemo(() => {
    if (!profiles || profiles.length === 0) return [];
    return sortProfilesByListingType(profiles as any, currentRotationKey);
  }, [profiles, currentRotationKey]);

  // Group by listing type
  const { topProfiles, premiumProfiles, basicProfiles } = useMemo(() => {
    const top = sortedProfiles.filter(p => p.listing_type === 'top');
    const premium = sortedProfiles.filter(p => p.listing_type === 'premium');
    const basic = sortedProfiles.filter(p => !p.listing_type || p.listing_type === 'basic');
    return { topProfiles: top, premiumProfiles: premium, basicProfiles: basic };
  }, [sortedProfiles]);

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Rotation-Debug-Tool
          </h3>
          <p className="text-sm text-muted-foreground">
            Zeigt die aktuelle Profil-Reihenfolge pro Tier (ändert sich alle 10 Min)
          </p>
        </div>
        <Button 
          onClick={() => setIsExpanded(!isExpanded)} 
          variant="outline"
          size="sm"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Verbergen
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Rotation anzeigen
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Rotation Key Info */}
          <div className="flex gap-4 flex-wrap">
            <Badge variant="outline" className="text-sm py-1 px-3">
              🔑 Rotation-Key: <span className="font-mono ml-1">{currentRotationKey}</span>
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              ⏱️ Nächste Rotation: <span className="font-mono ml-1">{nextRotationTime}</span>
            </Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              📊 Gesamt: {profiles.length} Profile
            </Badge>
          </div>

          {/* Profile Order by Tier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TOP Profiles */}
            <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-950/20">
              <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                🔥 TOP Profile ({topProfiles.length})
              </h4>
              {topProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Keine TOP Profile</p>
              ) : (
                <ol className="text-sm space-y-1">
                  {topProfiles.slice(0, 10).map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">{i + 1}.</span>
                      <span className="truncate">{p.display_name}</span>
                      {p.verified_at && <span className="text-xs">✓</span>}
                    </li>
                  ))}
                  {topProfiles.length > 10 && (
                    <li className="text-muted-foreground italic">
                      ... und {topProfiles.length - 10} weitere
                    </li>
                  )}
                </ol>
              )}
            </div>

            {/* Premium Profiles */}
            <div className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20">
              <h4 className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-2">
                ⭐ Premium Profile ({premiumProfiles.length})
              </h4>
              {premiumProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Keine Premium Profile</p>
              ) : (
                <ol className="text-sm space-y-1">
                  {premiumProfiles.slice(0, 10).map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">{i + 1}.</span>
                      <span className="truncate">{p.display_name}</span>
                      {p.verified_at && <span className="text-xs">✓</span>}
                    </li>
                  ))}
                  {premiumProfiles.length > 10 && (
                    <li className="text-muted-foreground italic">
                      ... und {premiumProfiles.length - 10} weitere
                    </li>
                  )}
                </ol>
              )}
            </div>

            {/* Basic Profiles */}
            <div className="border rounded-lg p-3 bg-muted/50">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                Basic Profile ({basicProfiles.length})
              </h4>
              {basicProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Keine Basic Profile</p>
              ) : (
                <ol className="text-sm space-y-1">
                  {basicProfiles.slice(0, 10).map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">{i + 1}.</span>
                      <span className="truncate">{p.display_name}</span>
                      {p.verified_at && <span className="text-xs">✓</span>}
                    </li>
                  ))}
                  {basicProfiles.length > 10 && (
                    <li className="text-muted-foreground italic">
                      ... und {basicProfiles.length - 10} weitere
                    </li>
                  )}
                </ol>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            💡 <strong>Verifizierung:</strong> Notiere die Reihenfolge, warte bis "Nächste Rotation" Zeit erreicht ist, 
            dann lade die Seite neu. Die Reihenfolge innerhalb jedes Tiers sollte sich geändert haben.
          </div>
        </div>
      )}
    </div>
  );
};
