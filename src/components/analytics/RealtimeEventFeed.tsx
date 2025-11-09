import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RealtimeEvent } from '@/hooks/useRealtimeAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface RealtimeEventFeedProps {
  events: RealtimeEvent[];
  activeUsersCount: number;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  page_view: 'Seitenaufruf',
  profile_view: 'Profil-Ansicht',
  search: 'Suche',
  contact_click: 'Kontakt-Klick',
  banner_click: 'Banner-Klick',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  page_view: 'bg-blue-500',
  profile_view: 'bg-green-500',
  search: 'bg-purple-500',
  contact_click: 'bg-orange-500',
  banner_click: 'bg-pink-500',
};

export const RealtimeEventFeed = ({ events, activeUsersCount }: RealtimeEventFeedProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to top when new events arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Event Feed</CardTitle>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {activeUsersCount} aktive User
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]" ref={scrollRef}>
          <div className="space-y-2" role="log" aria-label="Live event feed">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </p>
                    {event.event_data && (
                      <p className="text-xs text-muted-foreground">
                        {event.event_data.page || event.event_data.profile_id || ''}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
