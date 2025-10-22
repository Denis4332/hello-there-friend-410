import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const helmetContext = {};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider context={helmetContext}>
      <App />
    </HelmetProvider>
  </StrictMode>
);
