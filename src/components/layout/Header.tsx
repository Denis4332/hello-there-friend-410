import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { User, Menu, Search, Plus, LogOut, Shield } from 'lucide-react';

export const Header = () => {
  useDesignSettings(); // Apply design colors
  
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: navHome } = useSiteSetting('nav_home');
  const { data: navCities } = useSiteSetting('nav_cities');
  const { data: navCategories } = useSiteSetting('nav_categories');
  const { data: navContact } = useSiteSetting('nav_contact');
  const { data: navLogin } = useSiteSetting('nav_login');
  const { data: navMyAccount } = useSiteSetting('nav_my_account');
  const { data: navMyProfile } = useSiteSetting('nav_my_profile');
  const { data: navLogout } = useSiteSetting('nav_logout');
  const { data: logoUrl } = useSiteSetting('design_logo_url');
  const { data: logoText } = useSiteSetting('design_logo_text');

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={logoText || 'Logo'} className="h-8 object-contain" />
            ) : (
              <span className="text-xl font-bold">{logoText || 'ESCORIA'}</span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:underline">
              {navHome || 'Start'}
            </Link>
            <Link to="/staedte" className="hover:underline">
              {navCities || 'Städte'}
            </Link>
            <Link to="/kategorien" className="hover:underline">
              {navCategories || 'Kategorien'}
            </Link>
            <Link to="/kontakt" className="hover:underline">
              {navContact || 'Kontakt'}
            </Link>

            {/* Quick Actions */}
            <Link to="/profil/erstellen">
              <Button variant="secondary" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Inserat aufgeben</span>
              </Button>
            </Link>
            
            <Link to="/suche">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80">
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            {!user && (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  {navLogin || 'Anmelden'}
                </Button>
              </Link>
            )}
            {user && role === 'user' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80">
                    <User className="h-4 w-4 mr-2" />
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
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80">
                    <User className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    {navLogout || 'Abmelden'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          
          {/* Mobile Navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden text-primary-foreground hover:text-primary-foreground/80">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background overflow-y-auto">
              <nav className="flex flex-col gap-4 mt-8">
                {/* Primary Navigation */}
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary">
                  {navHome || 'Start'}
                </Link>
                <Link to="/staedte" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary">
                  {navCities || 'Städte'}
                </Link>
                <Link to="/kategorien" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary">
                  {navCategories || 'Kategorien'}
                </Link>

                <Separator />

                {/* Quick Actions */}
                <Link 
                  to="/profil/erstellen" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/80"
                >
                  <Plus className="h-5 w-5" />
                  Inserat aufgeben
                </Link>
                <Link 
                  to="/suche" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center gap-2 text-lg font-medium hover:text-primary"
                >
                  <Search className="h-5 w-5" />
                  Suche
                </Link>

                <Separator />

                {/* Extended Links */}
                <Link to="/agb" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
                  AGB
                </Link>
                <Link to="/datenschutz" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
                  Datenschutzerklärung
                </Link>
                <Link to="/kontakt" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
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
                        className="flex items-center gap-2 text-lg font-medium hover:text-primary"
                      >
                        <User className="h-5 w-5" />
                        {navMyProfile || 'Mein Profil'}
                      </Link>
                      {role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 text-lg font-medium text-primary hover:text-primary/80"
                        >
                          <Shield className="h-5 w-5" />
                          Admin Dashboard
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
    </header>
  );
};
