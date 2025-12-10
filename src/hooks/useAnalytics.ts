import { useCallback, useEffect, useRef } from 'react';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Check if user opted out
const isOptedOut = (): boolean => {
  return localStorage.getItem('analytics_opt_out') === 'true';
};

// Batched events queue - send in bulk every 30 seconds or on page unload
let eventQueue: Array<{ event_type: string; event_data: any; session_id: string; timestamp: string }> = [];
let flushTimeout: number | null = null;

const flushEvents = async () => {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    // Send all events in one batch request
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        event_type: 'batch',
        event_data: { events: eventsToSend },
        session_id: eventsToSend[0]?.session_id,
      }),
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.error('Analytics batch send error:', error);
  }
};

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0) {
      // Use sendBeacon for reliable delivery on page close
      const data = JSON.stringify({
        event_type: 'batch',
        event_data: { events: eventQueue },
        session_id: eventQueue[0]?.session_id,
      });
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`,
        new Blob([data], { type: 'application/json' })
      );
    }
  });
}

export const useAnalytics = () => {
  const sessionId = useRef(getSessionId());
  const lastPageView = useRef<string | null>(null);

  // Start flush timer on mount
  useEffect(() => {
    flushTimeout = window.setInterval(flushEvents, 30000); // Flush every 30 seconds
    return () => {
      if (flushTimeout) clearInterval(flushTimeout);
      flushEvents(); // Flush remaining on unmount
    };
  }, []);

  const trackEvent = useCallback((eventType: string, eventData?: any) => {
    if (isOptedOut()) return;

    // Add to queue instead of immediate send
    eventQueue.push({
      event_type: eventType,
      event_data: eventData,
      session_id: sessionId.current,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const trackPageView = useCallback((page: string) => {
    // Deduplicate consecutive page views to same page
    if (lastPageView.current === page) return;
    lastPageView.current = page;
    
    trackEvent('page_view', { page });
  }, [trackEvent]);

  const trackProfileView = useCallback(async (profileId: string) => {
    if (isOptedOut()) return;

    // Profile views still sent immediately (important for stats)
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-profile-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          profile_id: profileId,
          session_id: sessionId.current,
        }),
      });
    } catch (error) {
      // Silently fail
    }
  }, []);

  const trackSearch = useCallback((searchParams: {
    query?: string;
    canton?: string;
    category?: string;
    radius?: number;
    resultsCount?: number;
  }) => {
    trackEvent('search', searchParams);
  }, [trackEvent]);

  const trackContactClick = useCallback((profileId: string, contactType: string) => {
    trackEvent('contact_click', { profile_id: profileId, contact_type: contactType });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackProfileView,
    trackSearch,
    trackContactClick,
  };
};
