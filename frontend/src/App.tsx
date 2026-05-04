import { Route, Routes } from 'react-router-dom';

import { Home } from '@/pages/Home';
import { About } from '@/pages/About';
import { Signup } from '@/pages/Signup';
import { Login } from '@/pages/Login';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Settings } from '@/pages/Settings';
import { Transfer } from '@/pages/Transfer';
import { NotFound } from '@/pages/NotFound';
import { PublicLayout } from '@/components/PublicLayout';
import { ProtectedRoute, RedirectIfAuthed } from '@/components/ProtectedRoute';

export function App() {
  return (
    <Routes>
      {/* Public marketing pages, always visible regardless of auth state.
       *  PublicLayout shows different right-side nav buttons depending on
       *  whether the visitor is logged in. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Auth pages — bounce logged-in users to the dashboard */}
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <Signup />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />

      {/* Auth required, but rolebook may not exist yet */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Auth + rolebook required */}
      <Route element={<ProtectedRoute requireRolebook />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/:section" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/transfer" element={<Transfer />} />
      </Route>

      {/* 404 for anything unrouted */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
