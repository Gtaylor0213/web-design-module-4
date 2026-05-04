import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { getToken } from '@/lib/api';

/** Shared layout for public pages (Home, About). Renders a header with
 *  brand + nav + auth buttons, an <Outlet/> for the page body, and a
 *  small footer. Auth-aware: when the visitor has a token, the right-side
 *  buttons show "Dashboard" instead of "Log in / Sign up". */
export function PublicLayout() {
  const isAuthed = !!getToken();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-neutral-50 to-neutral-100">
      <header className="bg-white/80 backdrop-blur border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 sm:gap-8 min-w-0">
            <Link to="/" className="flex-shrink-0">
              <Logo className="text-lg" />
            </Link>
            <nav className="flex gap-1" aria-label="Main">
              <PublicNavLink to="/" end>
                Home
              </PublicNavLink>
              <PublicNavLink to="/about">About</PublicNavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthed ? (
              <Button asChild size="sm">
                <Link to="/dashboard">
                  Dashboard
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 px-6">
        <div className="max-w-5xl mx-auto text-sm text-neutral-500 flex flex-wrap justify-between gap-2">
          <span>© Rolebook</span>
          <span>A personal knowledge base for your role.</span>
        </div>
      </footer>
    </div>
  );
}

function PublicNavLink({
  to,
  end,
  children,
}: {
  to: string;
  end?: boolean;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors ' +
        (isActive
          ? 'text-neutral-900'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')
      }
    >
      {children}
    </NavLink>
  );
}
