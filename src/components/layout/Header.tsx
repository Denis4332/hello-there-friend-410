import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { EscoriaLogo } from '@/components/EscoriaLogo';
import { User, Menu, Search, Plus, LogOut, Shield, MessageCircle } from 'lucide-react';

export const Header = () => {
  useDesignSettings(); // Apply design colors
  
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Single batch load instead of 20 individual API calls
  const { getSetting } = useSiteSettingsContext();
  
  const navHome = getSetting('nav_home', 'Start');
  const navCantons = getSetting('nav_cantons', 'Kantone');
  const navCategories = getSetting('nav_categories', 'Kategorien');
  const navContact = getSetting('nav_contact', 'Kontakt');
  const navLogin = getSetting('nav_login', 'Anmelden');
  const navMyAccount = getSetting('nav_my_account', 'Mein Account');
  const navMyProfile = getSetting('nav_my_profile', 'Mein Profil');
  const navLogout = getSetting('nav_logout', 'Abmelden');
  const logoUrl = getSetting('design_logo_url');
  const logoText = getSetting('design_logo_text', 'ESCORIA');
  const navPrices = getSetting('nav_prices', 'Preise & Pakete');
  const navCreateAd = getSetting('nav_create_ad', 'Inserat aufgeben');
  const navAgb = getSetting('nav_agb', 'AGB');
  const navPrivacy = getSetting('nav_privacy', 'Datenschutzerklärung');
  const navSearch = getSetting('nav_search', 'Suche');
  const navAdmin = getSetting('nav_admin', 'Admin');
  const navAdminDashboard = getSetting('nav_admin_dashboard', 'Admin Dashboard');
  const navWelcome = getSetting('nav_welcome_title', 'Willkommen');

  return (
    <header className="bg-primary text-primary-foreground" role="banner">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2" aria-label="Zur Startseite">
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-8 object-contain" />
            ) : (
              <EscoriaLogo />
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-6" aria-label="Hauptnavigation">
            <Link to="/" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navHome}
            </Link>
            <Link to="/kantone" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navCantons}
            </Link>
            <Link to="/kategorien" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navCategories}
            </Link>
            <Link to="/preise" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navPrices}
            </Link>
            <Link to="/kontakt" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navContact}
            </Link>

            {/* Quick Actions */}
            <Link to="/profil/erstellen">
              <Button variant="secondary" size="sm" className="gap-2" aria-label={navCreateAd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{navCreateAd}</span>
              </Button>
            </Link>
            
            <Link to="/suche">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80" aria-label={navSearch}>
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{navSearch}</span>
              </Button>
            </Link>

            {!user && (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80" aria-label="Anmelden">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Anmelden</span>
                </Button>
              </Link>
            )}
            {user && (role === 'user' || role === null) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80" aria-label="Mein Account Menü öffnen">
                    <User className="h-4 w-4 mr-2" aria-hidden="true" />
                    {navMyAccount}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/mein-profil')}>
                    {navMyProfile}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/kontakt')}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Support kontaktieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    {navLogout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {user && role === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80" aria-label="Admin Menü öffnen">
                    <User className="h-4 w-4 mr-2" aria-hidden="true" />
                    Admin
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    {navAdminDashboard}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    {navLogout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          
          {/* Mobile CTA Icons */}
          <div className="flex md:hidden items-center gap-4">
            <Link to="/profil/erstellen">
              <Button variant="ghost" size="touch" className="text-primary-foreground hover:text-primary-foreground/80 active:text-primary-foreground/60" aria-label={navCreateAd}>
                <Plus className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">{navCreateAd}</span>
              </Button>
            </Link>
            
            {/* Account Icon - immer sichtbar */}
            <Link to={user ? "/mein-profil" : "/auth"}>
              <Button 
                variant="ghost" 
                size="touch" 
                className="text-primary-foreground hover:text-primary-foreground/80 active:text-primary-foreground/60" 
                aria-label={user ? "Mein Profil" : "Anmelden"}
              >
                <User className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">{user ? "Mein Profil" : "Anmelden"}</span>
              </Button>
            </Link>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="touch" className="text-primary-foreground hover:text-primary-foreground/80 active:text-primary-foreground/60" aria-label="Menü öffnen">
                  <Menu className="h-6 w-6" aria-hidden="true" />
                  <span className="sr-only">Menü</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-background overflow-y-auto" aria-label="Mobile Navigation">
                <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile Menü">
                  {/* Primary Navigation */}
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navHome}
                  </Link>
                  <Link to="/kantone" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navCantons}
                  </Link>
                  <Link to="/kategorien" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navCategories}
                  </Link>
                  <Link to="/preise" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navPrices}
                  </Link>

                  <Separator />

                  {/* Quick Actions */}
                  <Link 
                    to="/profil/erstellen" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-lg font-semibold text-primary hover:text-primary/80 active:text-primary/60 py-3 transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                    {navCreateAd}
                  </Link>
                  <Link 
                    to="/suche" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary active:text-primary/80 py-3 transition-colors"
                  >
                    <Search className="h-6 w-6" />
                    {navSearch}
                  </Link>

                  <Separator />

                  {/* Extended Links */}
                  <Link to="/agb" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground active:text-foreground/80 py-2 transition-colors">
                    {navAgb}
                  </Link>
                  <Link to="/datenschutz" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground active:text-foreground/80 py-2 transition-colors">
                    {navPrivacy}
                  </Link>
                  <Link to="/kontakt" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground active:text-foreground/80 py-2 transition-colors">
                    {navContact}
                  </Link>

                  {!user ? (
                    <>
                      <Separator />
                      <Button onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }} className="mt-2">
                        {navLogin}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Separator />
                      <div className="mt-2 space-y-3">
                        <Link
                          to="/mein-profil"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-lg font-medium hover:text-primary active:text-primary/80 py-3 transition-colors"
                        >
                          <User className="h-6 w-6" />
                          {navMyProfile}
                        </Link>
                        <Link
                          to="/kontakt"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-lg font-medium text-primary hover:text-primary/80 active:text-primary/60 py-3 transition-colors"
                        >
                          <MessageCircle className="h-6 w-6" />
                          Support kontaktieren
                        </Link>
                        {role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-lg font-medium text-primary hover:text-primary/80 active:text-primary/60 py-3 transition-colors"
                          >
                            <Shield className="h-6 w-6" />
                            {navAdminDashboard}
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => { signOut(); setMobileMenuOpen(false); }}
                          className="w-full justify-start gap-2"
                        >
                          <LogOut className="h-5 w-5" />
                          {navLogout}
                        </Button>
                      </div>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
