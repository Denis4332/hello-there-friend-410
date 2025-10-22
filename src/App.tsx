import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Suche from "./pages/Suche";
import Profil from "./pages/Profil";
import Stadt from "./pages/Stadt";
import Kategorie from "./pages/Kategorie";
import Cities from "./pages/Cities";
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
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCities from "./pages/admin/AdminCities";
import AdminReports from "./pages/admin/AdminReports";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { UserProtectedRoute } from "./components/UserProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/suche" element={<Suche />} />
            <Route path="/profil/:slug" element={<Profil />} />
            <Route path="/stadt/:slug" element={<Stadt />} />
            <Route path="/kategorie/:slug" element={<Kategorie />} />
            <Route path="/staedte" element={<Cities />} />
            <Route path="/kategorien" element={<Categories />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="/agb" element={<AGB />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/cities" element={<ProtectedRoute><AdminCities /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
