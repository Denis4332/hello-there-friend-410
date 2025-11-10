import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  viewport: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

/**
 * Detect device type based on viewport width and user agent
 */
const detectDeviceType = (): DeviceInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for mobile/tablet in user agent
  const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTabletUA = /tablet|ipad|playbook|silk/i.test(userAgent);
  
  // Determine device type based on viewport width and user agent
  let type: 'mobile' | 'tablet' | 'desktop';
  if (width < 768 || isMobileUA) {
    type = 'mobile';
  } else if (width < 1024 || isTabletUA) {
    type = 'tablet';
  } else {
    type = 'desktop';
  }
  
  // Get connection information if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    type,
    viewport: { width, height },
    connection: connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    } : undefined,
  };
};

/**
 * Enhanced metric data with device information
 */
interface EnhancedMetric extends Metric {
  device: DeviceInfo;
}

const sendToAnalytics = (metric: Metric) => {
  const deviceInfo = detectDeviceType();
  const enhancedMetric: EnhancedMetric = {
    ...metric,
    device: deviceInfo,
  };
  
  // Log to console in development with device info
  if (import.meta.env.DEV) {
    console.log(
      `[Web Vitals - ${deviceInfo.type.toUpperCase()}] ${metric.name}:`,
      metric.value,
      {
        viewport: `${deviceInfo.viewport.width}x${deviceInfo.viewport.height}`,
        connection: deviceInfo.connection?.effectiveType || 'unknown',
        rating: metric.rating,
      }
    );
  }
  
  // In production, send to analytics with device segmentation
  // Example for Supabase Edge Function:
  // fetch('/api/track-web-vitals', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(enhancedMetric),
  // });
  
  // Store in localStorage for debugging (last 10 metrics per device type)
  try {
    const storageKey = `webVitals_${deviceInfo.type}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    stored.push({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    });
    // Keep only last 10 entries
    if (stored.length > 10) stored.shift();
    localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch (e) {
    // Silent fail for localStorage errors
  }
};

/**
 * Track Web Vitals with device-specific monitoring
 */
export const trackWebVitals = () => {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};

/**
 * Get stored Web Vitals data for a specific device type
 */
export const getWebVitalsData = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
  try {
    const storageKey = `webVitals_${deviceType}`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored Web Vitals data
 */
export const clearWebVitalsData = () => {
  try {
    localStorage.removeItem('webVitals_mobile');
    localStorage.removeItem('webVitals_tablet');
    localStorage.removeItem('webVitals_desktop');
  } catch {
    // Silent fail
  }
};
