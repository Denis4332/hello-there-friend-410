import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import App from "./App.tsx";
import "./index.css";
import { trackWebVitals } from "./utils/webVitals";

const helmetContext = {};

// Track Web Vitals for performance monitoring
trackWebVitals();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <SiteSettingsProvider>
          <App />
        </SiteSettingsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);
