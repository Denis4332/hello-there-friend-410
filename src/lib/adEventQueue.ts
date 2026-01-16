/**
 * Ad Event Queue - Batches ad tracking events to reduce API calls
 * 
 * Instead of 4-6 parallel POSTs per page load, this queues events
 * and sends them in a single batch request.
 */

interface AdEvent {
  ad_id: string;
  event_type: 'impression' | 'click';
}

// Queue for pending events
const queue: AdEvent[] = [];

// Timer for batch flush (strict typing for browser setTimeout)
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// Deduplication: track recently sent events to prevent duplicates
const recentEvents = new Map<string, number>();

// Constants
const BATCH_DELAY_MS = 300;
const DEDUP_WINDOW_MS = 2000;
const MAX_QUEUE_SIZE = 200;

/**
 * Get the Supabase URL for edge function calls
 */
const getSupabaseUrl = (): string => {
  return import.meta.env.VITE_SUPABASE_URL || '';
};

/**
 * Flush all queued events to the server
 */
const flush = async (): Promise<void> => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (queue.length === 0) return;

  // Take all events from queue
  const eventsToSend = queue.splice(0, queue.length);

  const url = getSupabaseUrl();
  if (!url) return;

  try {
    // Send as batch (edge function supports both single and batch format)
    await fetch(`${url}/functions/v1/track-ad-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend }),
      keepalive: true, // Ensures request completes even if page unloads
    });
  } catch {
    // Silent fail - ad tracking should never break the app
  }
};

/**
 * Queue an ad event for batched sending
 * 
 * @param adId - The advertisement ID
 * @param eventType - Either 'impression' or 'click'
 */
export const queueAdEvent = (adId: string, eventType: 'impression' | 'click'): void => {
  // Deduplication check
  const dedupKey = `${adId}:${eventType}`;
  const now = Date.now();
  const lastSent = recentEvents.get(dedupKey);

  if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
    // Skip duplicate within dedup window
    return;
  }

  // Mark as recently sent
  recentEvents.set(dedupKey, now);

  // Safety guard: prevent memory leaks
  if (queue.length >= MAX_QUEUE_SIZE) {
    // Force flush before adding more
    void flush();
  }

  // Add to queue
  queue.push({ ad_id: adId, event_type: eventType });

  // Schedule flush if not already scheduled
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      void flush();
    }, BATCH_DELAY_MS);
  }
};

/**
 * Force immediate flush (used on page unload)
 */
export const flushAdEvents = (): void => {
  void flush();
};

// Flush on page visibility change (user navigates away)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flush();
    }
  });
}

// Cleanup old dedup entries periodically (every 10 seconds)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentEvents.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS * 2) {
        recentEvents.delete(key);
      }
    }
  }, 10000);
}
