import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAnalytics } from "./hooks/useAnalytics";
import { useDesignSettings } from "./hooks/useDesignSettings";
import { ScrollToTop } from "./components/ScrollToTop";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { UserProtectedRoute } from "./components/UserProtectedRoute";
import { PageSkeleton } from "./components/PageSkeleton";

// Eager load only homepage and auth
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";

// Lazy load all other pages for optimal code splitting
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Suche = lazy(() => import("./pages/Suche"));
const Profil = lazy(() => import("./pages/Profil"));
const Kategorie = lazy(() => import("./pages/Kategorie"));
const Kantone = lazy(() => import("./pages/Kantone"));
const Categories = lazy(() => import("./pages/Categories"));
const Kontakt = lazy(() => import("./pages/Kontakt"));
const AGB = lazy(() => import("./pages/AGB"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Preise = lazy(() => import("./pages/Preise"));
const ProfileCreate = lazy(() => import("./pages/ProfileCreate"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));

const ProfileUpgrade = lazy(() => import("./pages/ProfileUpgrade"));
const ZahlungErfolg = lazy(() => import("./pages/ZahlungErfolg"));
const ZahlungAbgebrochen = lazy(() => import("./pages/ZahlungAbgebrochen"));
const PayportReturn = lazy(() => import("./pages/PayportReturn"));
const DebugIcons = lazy(() => import("./pages/DebugIcons"));

// Lazy load admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminAccount = lazy(() => import("./pages/admin/AdminAccount"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCities = lazy(() => import("./pages/admin/AdminCities"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminDropdowns = lazy(() => import("./pages/admin/AdminDropdowns"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminRateLimits = lazy(() => import("./pages/admin/AdminRateLimits"));
const AdminPerformance = lazy(() => import("./pages/admin/AdminPerformance"));
const AdminPendingPayments = lazy(() => import("./pages/admin/AdminPendingPayments"));
const AdminExport = lazy(() => import("./pages/admin/AdminExport"));
const AdminTierDashboard = lazy(() => import("./pages/admin/AdminTierDashboard"));


const PageViewTracker = () => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();
  
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname, trackPageView]);
  
  return null;
};

const App = () => {
  useDesignSettings(); // Load dynamic colors, font, border-radius from database
  
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <BrowserRouter>
            <ScrollToTop />
            <PageViewTracker />
            
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/suche" element={<Suche />} />
                <Route path="/profil/:slug" element={<Profil />} />
                <Route path="/stadt/:slug" element={<Navigate to="/suche" replace />} />
                <Route path="/kategorie/:slug" element={<Kategorie />} />
                <Route path="/staedte" element={<Navigate to="/kantone" replace />} />
                <Route path="/kantone" element={<Kantone />} />
                <Route path="/kategorien" element={<Categories />} />
                <Route path="/kontakt" element={<Kontakt />} />
                <Route path="/agb" element={<AGB />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/preise" element={<Preise />} />
                <Route path="/zahlung/erfolg" element={<ZahlungErfolg />} />
                <Route path="/zahlung/abgebrochen" element={<ZahlungAbgebrochen />} />
                <Route path="/payport/return" element={<PayportReturn />} />
                <Route path="/500" element={<ServerError />} />
                <Route path="/debug/icons" element={<DebugIcons />} />
                <Route
                  path="/profil/erstellen"
                  element={
                    <UserProtectedRoute>
                      <ProfileCreate />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/mein-profil"
                  element={
                    <UserProtectedRoute>
                      <UserDashboard />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/profil/bearbeiten"
                  element={
                    <UserProtectedRoute>
                      <ProfileEdit />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/user/upgrade"
                  element={
                    <UserProtectedRoute>
                      <ProfileUpgrade />
                    </UserProtectedRoute>
                  }
                />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
                <Route path="/admin/account" element={<ProtectedRoute><AdminAccount /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                <Route path="/admin/cities" element={<ProtectedRoute><AdminCities /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
                <Route path="/admin/messages" element={<ProtectedRoute><AdminMessages /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                <Route path="/admin/dropdowns" element={<ProtectedRoute><AdminDropdowns /></ProtectedRoute>} />
                <Route path="/admin/verifications" element={<ProtectedRoute><AdminVerifications /></ProtectedRoute>} />
                <Route path="/admin/pending-payments" element={<ProtectedRoute><AdminPendingPayments /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/admin/rate-limits" element={<ProtectedRoute><AdminRateLimits /></ProtectedRoute>} />
                <Route path="/admin/performance" element={<ProtectedRoute><AdminPerformance /></ProtectedRoute>} />
                <Route path="/admin/export" element={<ProtectedRoute><AdminExport /></ProtectedRoute>} />
                <Route path="/admin/tier-dashboard" element={<ProtectedRoute><AdminTierDashboard /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  );
};

export default App;
