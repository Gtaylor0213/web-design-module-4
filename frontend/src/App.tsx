import { Route, Routes } from 'react-router-dom';

import { Landing } from '@/pages/Landing';
import { Signup } from '@/pages/Signup';
import { Login } from '@/pages/Login';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Settings } from '@/pages/Settings';
import { ProtectedRoute, RedirectIfAuthed } from '@/components/ProtectedRoute';

export function App() {
  return (
    <Routes>
      {/* Public, but bounce logged-in users to the dashboard */}
      <Route
        path="/"
        element={
          <RedirectIfAuthed>
            <Landing />
          </RedirectIfAuthed>
        }
      />
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
      </Route>

      {/* Fallback — anything unrouted goes home */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
