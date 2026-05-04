import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { BookMarked, LogOut, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/hooks/useAuth';
import { useRolebook } from '@/hooks/useRolebook';

import { ContactsSection } from '@/pages/sections/ContactsSection';
import { ProjectsSection } from '@/pages/sections/ProjectsSection';
import { SoftwareSection } from '@/pages/sections/SoftwareSection';
import { RecurringSection } from '@/pages/sections/RecurringSection';
import { NotesSection } from '@/pages/sections/NotesSection';

const SECTIONS = [
  { slug: 'contacts', label: 'Contacts' },
  { slug: 'projects', label: 'Projects' },
  { slug: 'software', label: 'Software' },
  { slug: 'recurring', label: 'Recurring' },
  { slug: 'notes', label: 'Notes' },
] as const;

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  contacts: ContactsSection,
  projects: ProjectsSection,
  software: SoftwareSection,
  recurring: RecurringSection,
  notes: NotesSection,
};

export function Dashboard() {
  const { pathname } = useLocation();
  const params = useParams<{ section?: string }>();
  const me = useMe();
  const rolebook = useRolebook();
  const logout = useLogout();

  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return <Navigate to="/dashboard/contacts" replace />;
  }

  const activeSlug = params.section ?? 'contacts';
  const SectionComponent = SECTION_COMPONENTS[activeSlug];

  if (!SectionComponent) {
    return <Navigate to="/dashboard/contacts" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookMarked className="h-5 w-5 text-neutral-700" />
            <div>
              <p className="text-sm font-semibold text-neutral-900 leading-tight">Rolebook</p>
              {rolebook.data && (
                <p className="text-xs text-neutral-600 leading-tight">
                  {rolebook.data.role_title}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {me.data && (
              <span className="text-sm text-neutral-600 hidden sm:inline mr-2">
                {me.data.name}
              </span>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Sections">
            {SECTIONS.map((s) => {
              const active = s.slug === activeSlug;
              return (
                <Link
                  key={s.slug}
                  to={`/dashboard/${s.slug}`}
                  className={
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors ' +
                    (active
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300')
                  }
                >
                  {s.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <SectionComponent />
      </main>
    </div>
  );
}
