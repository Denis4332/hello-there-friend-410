import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { User, Menu } from 'lucide-react';

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
            {!user && (
              <Link to="/auth">
                <Button variant="secondary" size="sm">
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
            <SheetContent side="right" className="w-[300px] bg-background">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary">
                  {navHome || 'Start'}
                </Link>
                <Link to="/staedte" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary">
                  {navCities || 'Städte'}
                </Link>
                <Link to="/kategorien" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary">
                  {navCategories || 'Kategorien'}
                </Link>
                <Link to="/kontakt" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary">
                  {navContact || 'Kontakt'}
                </Link>
                
                {!user && (
                  <>
                    <Separator />
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">
                        {navLogin || 'Anmelden'}
                      </Button>
                    </Link>
                  </>
                )}
                
                {user && (
                  <>
                    <Separator />
                    <Link to="/mein-profil" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary">
                      {navMyProfile || 'Mein Profil'}
                    </Link>
                    <Button variant="ghost" className="justify-start" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                      {navLogout || 'Abmelden'}
                    </Button>
                  </>
                )}
                
                {user && role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary">
                    Admin Dashboard
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
