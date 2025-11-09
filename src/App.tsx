import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAnalytics } from "./hooks/useAnalytics";
import Index from "./pages/Index";
import Suche from "./pages/Suche";
import Profil from "./pages/Profil";
import Stadt from "./pages/Stadt";
import Kategorie from "./pages/Kategorie";
import Cities from "./pages/Cities";
import Kantone from "./pages/Kantone";
import Categories from "./pages/Categories";
import Kontakt from "./pages/Kontakt";
import AGB from "./pages/AGB";
import Datenschutz from "./pages/Datenschutz";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import Auth from "./pages/Auth";
import ProfileCreate from "./pages/ProfileCreate";
import UserDashboard from "./pages/UserDashboard";
import ProfileEdit from "./pages/ProfileEdit";
// Lazy load admin pages for better code splitting
import { lazy } from "react";
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
const AdminAdvertisements = lazy(() => import("./pages/admin/AdminAdvertisements"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { UserProtectedRoute } from "./components/UserProtectedRoute";
import { useDesignSettings } from "./hooks/useDesignSettings";
import { BannerManager } from "./components/BannerManager";
import Bannerpreise from "./pages/Bannerpreise";
import Preise from "./pages/Preise";
import ProfileUpgrade from "./pages/ProfileUpgrade";

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
      retry: 1, // Only retry failed requests once
    },
  },
});

const PageViewTracker = () => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();
  
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname, trackPageView]);
  
  return null;
};

const AppContent = () => {
  useDesignSettings(); // Load dynamic colors from database
  
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter>
            <PageViewTracker />
            <BannerManager />
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/suche" element={<Suche />} />
            <Route path="/profil/:slug" element={<Profil />} />
            <Route path="/stadt/:slug" element={<Stadt />} />
            <Route path="/kategorie/:slug" element={<Kategorie />} />
            <Route path="/staedte" element={<Navigate to="/kantone" replace />} />
            <Route path="/kantone" element={<Kantone />} />
            <Route path="/kategorien" element={<Categories />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="/agb" element={<AGB />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/bannerpreise" element={<Bannerpreise />} />
            <Route path="/preise" element={<Preise />} />
            <Route path="/500" element={<ServerError />} />
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
            <Route path="/admin/advertisements" element={<ProtectedRoute><AdminAdvertisements /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
