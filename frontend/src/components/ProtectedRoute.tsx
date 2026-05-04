import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { getToken } from '@/lib/api';
import { useMe } from '@/hooks/useAuth';
import { useRolebook } from '@/hooks/useRolebook';

interface ProtectedRouteProps {
  /** When true, also requires the user to have completed onboarding (have a
   *  rolebook). If they have no rolebook, redirects to /onboarding. */
  requireRolebook?: boolean;
}

/** Used as a layout route: <Route element={<ProtectedRoute/>}>{children}</Route>.
 *  Redirects to /login if no auth token, /onboarding if requireRolebook and
 *  the user has no rolebook yet, otherwise renders <Outlet/>. */
export function ProtectedRoute({ requireRolebook = false }: ProtectedRouteProps) {
  const location = useLocation();
  const me = useMe();
  const rolebook = useRolebook();

  // No token at all — bounce to login. Avoid even firing the queries.
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Token present but /me is loading.
  if (me.isLoading) return <FullPageSpinner />;

  // Token present but /me failed (almost certainly 401: token expired or
  // invalid). Clear our local copy and bounce.
  if (me.isError || !me.data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireRolebook) {
    if (rolebook.isLoading) return <FullPageSpinner />;
    if (!rolebook.data) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <Outlet />;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      <div className="animate-pulse text-sm">Loading…</div>
    </div>
  );
}

/** For pages where being logged in means "you don't belong here" —
 *  the landing page, login, signup. Redirects to /dashboard if a token
 *  exists; otherwise renders the page. */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const me = useMe();
  if (getToken() && me.data) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
