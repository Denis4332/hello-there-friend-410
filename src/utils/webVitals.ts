import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

const sendToAnalytics = (metric: Metric) => {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
  
  // In production, you can send to your analytics service
  // Example: analytics.track('web_vital', { name: metric.name, value: metric.value });
};

export const trackWebVitals = () => {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};
