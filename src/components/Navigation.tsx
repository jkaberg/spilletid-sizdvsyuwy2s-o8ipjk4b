import { NavLink } from 'react-router-dom';
import { Home, Users, Settings, LogOut, Menu, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/translations';
const NavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary focus:ring-2 focus:ring-heimdal-green focus:ring-offset-2",
        isActive && "bg-heimdal-green text-white hover:text-white hover:bg-heimdal-green/90"
      )
    }
  >
    <Icon className="h-4 w-4" />
    {label}
  </NavLink>
);
export function Navigation() {
  const { t } = useTranslation();
  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: Home },
    { to: '/tournament', label: t('nav.tournaments'), icon: Layers },
    { to: '/team', label: t('nav.team'), icon: Users },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];
  const HeimdalLogo = () => (
    <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Heimdal Fotball Logo" className="h-8 w-8 rounded-full border-2 border-heimdal-red hover:scale-105 transition-all duration-200 shadow-glow">
      <rect width="100" height="100" fill="#006400"/>
      <text x="50" y="65" textAnchor="middle" fill="#DC143C" fontSize="40" fontWeight="bold" fontFamily="Inter, sans-serif">H-F</text>
      <circle cx="50" cy="20" r="8" fill="#FFD700"/>
    </svg>
  );
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block fixed top-0 left-0 h-full w-64 z-40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 bg-heimdal-green text-white">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <HeimdalLogo />
              <span className="">{t('nav.title')}</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4" role="navigation" aria-label="Main navigation">
              {navItems.map(item => <NavItem key={item.to} {...item} />)}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => auth.logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Header */}
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0" aria-label={t('nav.title')}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium" role="navigation" aria-label="Main navigation">
              <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                <HeimdalLogo />
                <span>{t('nav.title')}</span>
              </NavLink>
              {navItems.map(item => <NavItem key={item.to} {...item} />)}
            </nav>
            <div className="mt-auto">
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => auth.logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
          {/* Optional: Add search or other header items here */}
        </div>
      </header>
    </>
  );
}