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

export const useAnalytics = () => {
  const sessionId = useRef(getSessionId());

  const trackEvent = useCallback(async (eventType: string, eventData?: any) => {
    if (isOptedOut()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          event_type: eventType,
          event_data: eventData,
          session_id: sessionId.current,
        }),
      });

      if (!response.ok && import.meta.env.DEV) {
        console.error('Failed to track event');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Analytics tracking error:', error);
      }
    }
  }, []);

  const trackPageView = useCallback((page: string) => {
    trackEvent('page_view', { page, timestamp: new Date().toISOString() });
  }, [trackEvent]);

  const trackProfileView = useCallback(async (profileId: string) => {
    if (isOptedOut()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-profile-view`, {
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

      if (!response.ok && import.meta.env.DEV) {
        console.error('Failed to track profile view');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Profile view tracking error:', error);
      }
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
