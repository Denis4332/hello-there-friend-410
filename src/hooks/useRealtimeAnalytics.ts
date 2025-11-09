import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
}

export const useRealtimeAnalytics = () => {
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  useEffect(() => {
    // Fetch initial recent events
    const fetchRecentEvents = async () => {
      const { data } = await supabase
        .from('analytics_events')
        .select('id, event_type, event_data, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setRecentEvents(data);
    };

    // Count active users (last 5 minutes)
    const countActiveUsers = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('analytics_events')
        .select('session_id')
        .gte('created_at', fiveMinutesAgo);

      if (data) {
        const uniqueSessions = new Set(data.map((e: any) => e.session_id));
        setActiveUsersCount(uniqueSessions.size);
      }
    };

    fetchRecentEvents();
    countActiveUsers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('analytics_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        (payload) => {
          const newEvent = payload.new as RealtimeEvent;
          setRecentEvents((prev) => [newEvent, ...prev].slice(0, 50));
          countActiveUsers();
        }
      )
      .subscribe();

    // Refresh active users count every 30 seconds
    const interval = setInterval(countActiveUsers, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { recentEvents, activeUsersCount };
};
