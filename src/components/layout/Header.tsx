import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { EscoriaLogo } from '@/components/EscoriaLogo';
import { User, Menu, Search, Plus, LogOut, Shield } from 'lucide-react';

export const Header = () => {
  useDesignSettings(); // Apply design colors
  
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: navHome } = useSiteSetting('nav_home');
  const { data: navCantons } = useSiteSetting('nav_cantons');
  const { data: navCategories } = useSiteSetting('nav_categories');
  const { data: navBanners } = useSiteSetting('nav_banners');
  const { data: navContact } = useSiteSetting('nav_contact');
  const { data: navLogin } = useSiteSetting('nav_login');
  const { data: navMyAccount } = useSiteSetting('nav_my_account');
  const { data: navMyProfile } = useSiteSetting('nav_my_profile');
  const { data: navLogout } = useSiteSetting('nav_logout');
  const { data: logoUrl } = useSiteSetting('design_logo_url');
  const { data: logoText } = useSiteSetting('design_logo_text');
  const { data: navPrices } = useSiteSetting('nav_prices');
  const { data: navCreateAd } = useSiteSetting('nav_create_ad');
  const { data: navAgb } = useSiteSetting('nav_agb');
  const { data: navPrivacy } = useSiteSetting('nav_privacy');
  const { data: navSearch } = useSiteSetting('nav_search');
  const { data: navAdmin } = useSiteSetting('nav_admin');
  const { data: navAdminDashboard } = useSiteSetting('nav_admin_dashboard');
  const { data: navWelcome } = useSiteSetting('nav_welcome_title');

  return (
    <header className="bg-primary text-primary-foreground" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2" aria-label="Zur Startseite">
            {logoUrl ? (
              <img src={logoUrl} alt={logoText || 'ESCORIA'} className="h-8 object-contain" />
            ) : (
              <EscoriaLogo />
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-6" aria-label="Hauptnavigation">
            <Link to="/" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navHome || 'Start'}
            </Link>
            <Link to="/kantone" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navCantons || 'Kantone'}
            </Link>
            <Link to="/kategorien" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navCategories || 'Kategorien'}
            </Link>
            <Link to="/preise" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navPrices || 'Preise & Pakete'}
            </Link>
            <Link to="/bannerpreise" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navBanners || 'Werbung'}
            </Link>
            <Link to="/kontakt" className="hover:underline active:text-primary-foreground/80 transition-colors">
              {navContact || 'Kontakt'}
            </Link>

            {/* Quick Actions */}
            <Link to="/profil/erstellen">
              <Button variant="secondary" size="sm" className="gap-2" aria-label={navCreateAd || 'Inserat aufgeben'}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{navCreateAd || 'Inserat aufgeben'}</span>
              </Button>
            </Link>
            
            <Link to="/suche">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80" aria-label={navSearch || 'Suche'}>
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{navSearch || 'Suche'}</span>
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
                    {navMyAccount || 'Mein Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/mein-profil')}>
                    {navMyProfile || 'Mein Profil'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    {navLogout || 'Abmelden'}
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
                    {navAdminDashboard || 'Admin Dashboard'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    {navLogout || 'Abmelden'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          
          {/* Mobile CTA Icons */}
          <div className="flex md:hidden items-center gap-4">
            <Link to="/profil/erstellen">
              <Button variant="ghost" size="touch" className="text-primary-foreground hover:text-primary-foreground/80 active:text-primary-foreground/60" aria-label={navCreateAd || 'Inserat aufgeben'}>
                <Plus className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">{navCreateAd || 'Inserat aufgeben'}</span>
              </Button>
            </Link>
            
            {!user && (
              <Link to="/auth">
                <Button variant="ghost" size="touch" className="text-primary-foreground hover:text-primary-foreground/80 active:text-primary-foreground/60" aria-label="Anmelden">
                  <User className="h-6 w-6" aria-hidden="true" />
                  <span className="sr-only">Anmelden</span>
                </Button>
              </Link>
            )}
            
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
                    {navHome || 'Start'}
                  </Link>
                  <Link to="/kantone" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navCantons || 'Kantone'}
                  </Link>
                  <Link to="/kategorien" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navCategories || 'Kategorien'}
                  </Link>
                  <Link to="/preise" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navPrices || 'Preise & Pakete'}
                  </Link>
                  <Link to="/bannerpreise" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary active:text-primary/80 py-2 transition-colors">
                    {navBanners || 'Werbung'}
                  </Link>

                  <Separator />

                  {/* Quick Actions */}
                  <Link 
                    to="/profil/erstellen" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-lg font-semibold text-primary hover:text-primary/80 active:text-primary/60 py-3 transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                    {navCreateAd || 'Inserat aufgeben'}
                  </Link>
                  <Link 
                    to="/suche" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary active:text-primary/80 py-3 transition-colors"
                  >
                    <Search className="h-6 w-6" />
                    {navSearch || 'Suche'}
                  </Link>

                  <Separator />

                  {/* Extended Links */}
                  <Link to="/agb" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground active:text-foreground/80 py-2 transition-colors">
                    {navAgb || 'AGB'}
                  </Link>
                  <Link to="/datenschutz" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground active:text-foreground/80 py-2 transition-colors">
                    {navPrivacy || 'Datenschutzerklärung'}
                  </Link>
                  <Link to="/kontakt" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground active:text-foreground/80 py-2 transition-colors">
                    {navContact || 'Kontakt'}
                  </Link>

                  {!user ? (
                    <>
                      <Separator />
                      <Button onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }} className="mt-2">
                        {navLogin || 'Anmelden'}
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
                          {navMyProfile || 'Mein Profil'}
                        </Link>
                        {role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-lg font-medium text-primary hover:text-primary/80 active:text-primary/60 py-3 transition-colors"
                          >
                            <Shield className="h-6 w-6" />
                            {navAdminDashboard || 'Admin Dashboard'}
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => { signOut(); setMobileMenuOpen(false); }}
                          className="w-full justify-start gap-2"
                        >
                          <LogOut className="h-5 w-5" />
                          {navLogout || 'Abmelden'}
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
