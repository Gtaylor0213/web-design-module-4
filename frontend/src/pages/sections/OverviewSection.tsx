import { Link } from 'react-router-dom';
import {
  AppWindow,
  CalendarClock,
  FolderKanban,
  NotebookPen,
  Repeat,
  Star,
  Users,
} from 'lucide-react';

import { useEntities } from '@/lib/crud';
import { cn } from '@/lib/utils';
import type {
  Contact,
  Note,
  Project,
  RecurringTask,
  Software,
} from '@/lib/types';

/** Dashboard "Overview" tab — derived entirely from the existing section
 *  queries. Shows favorited contacts, upcoming project deadlines,
 *  at-a-glance counts, and recently-updated entries from across the
 *  Rolebook. Each card item links to the matching section tab. */
export function OverviewSection() {
  const contacts = useEntities<Contact>('contacts');
  const projects = useEntities<Project>('projects');
  const software = useEntities<Software>('software');
  const recurring = useEntities<RecurringTask>('recurring-tasks');
  const notes = useEntities<Note>('notes');

  const isLoading =
    contacts.isLoading ||
    projects.isLoading ||
    software.isLoading ||
    recurring.isLoading ||
    notes.isLoading;

  const favoriteContacts =
    (contacts.data ?? []).filter((c) => c.favorite).slice(0, 5);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingProjects = (projects.data ?? [])
    .filter((p) => p.status === 'active' && p.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  const counts = {
    activeProjects: (projects.data ?? []).filter((p) => p.status === 'active').length,
    onHoldProjects: (projects.data ?? []).filter((p) => p.status === 'on_hold').length,
    weekly: (recurring.data ?? []).filter((r) => r.cadence === 'weekly').length,
    monthly: (recurring.data ?? []).filter((r) => r.cadence === 'monthly').length,
    semester: (recurring.data ?? []).filter((r) => r.cadence === 'semester').length,
    adHoc: (recurring.data ?? []).filter((r) => r.cadence === 'ad_hoc').length,
    contacts: (contacts.data ?? []).length,
    software: (software.data ?? []).length,
    notes: (notes.data ?? []).length,
  };

  // Recently updated, merged across sections.
  const recent = [
    ...(contacts.data ?? []).map((c) => ({
      key: `contact-${c.id}`,
      type: 'Contact',
      icon: Users,
      title: c.name,
      to: '/dashboard/contacts',
      updatedAt: c.updated_at,
    })),
    ...(projects.data ?? []).map((p) => ({
      key: `project-${p.id}`,
      type: 'Project',
      icon: FolderKanban,
      title: p.title,
      to: '/dashboard/projects',
      updatedAt: p.updated_at,
    })),
    ...(software.data ?? []).map((s) => ({
      key: `software-${s.id}`,
      type: 'Software',
      icon: AppWindow,
      title: s.name,
      to: '/dashboard/software',
      updatedAt: s.updated_at,
    })),
    ...(recurring.data ?? []).map((r) => ({
      key: `recurring-${r.id}`,
      type: 'Recurring',
      icon: Repeat,
      title: r.name,
      to: '/dashboard/recurring',
      updatedAt: r.updated_at,
    })),
    ...(notes.data ?? []).map((n) => ({
      key: `note-${n.id}`,
      type: 'Note',
      icon: NotebookPen,
      title: n.title,
      to: '/dashboard/notes',
      updatedAt: n.updated_at,
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  if (isLoading) {
    return <div className="text-sm text-neutral-500 py-12 text-center">Loading…</div>;
  }

  const totalEntries =
    counts.contacts + counts.software + counts.notes +
    (projects.data ?? []).length + (recurring.data ?? []).length;

  if (totalEntries === 0) {
    return (
      <EmptyOverview />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-1">
        Overview
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        A snapshot of your Rolebook.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card title="Favorited contacts" icon={Star} cta={{ label: 'View all', to: '/dashboard/contacts' }}>
          {favoriteContacts.length === 0 ? (
            <EmptyHint>
              Star a contact in the Contacts tab to pin it here.
            </EmptyHint>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {favoriteContacts.map((c) => (
                <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link to="/dashboard/contacts" className="block hover:text-primary">
                    <p className="font-medium leading-tight">{c.name}</p>
                    {c.role && (
                      <p className="text-xs text-neutral-500 mt-0.5">{c.role}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming deadlines" icon={CalendarClock} cta={{ label: 'All projects', to: '/dashboard/projects' }}>
          {upcomingProjects.length === 0 ? (
            <EmptyHint>
              No active projects with deadlines.
            </EmptyHint>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {upcomingProjects.map((p) => {
                const overdue = p.deadline < today;
                return (
                  <li key={p.id} className="py-2.5 first:pt-0 last:pb-0">
                    <Link to="/dashboard/projects" className="block hover:text-primary">
                      <p className="font-medium leading-tight">{p.title}</p>
                      <p className={cn('text-xs mt-0.5', overdue ? 'text-red-600 font-medium' : 'text-neutral-500')}>
                        {overdue ? 'Overdue · ' : 'Due '}
                        {formatDate(p.deadline)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="At a glance" icon={null} flat>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Contacts" value={counts.contacts} to="/dashboard/contacts" />
          <Stat label="Active projects" value={counts.activeProjects} to="/dashboard/projects" />
          <Stat label="Software" value={counts.software} to="/dashboard/software" />
          <Stat label="Weekly tasks" value={counts.weekly} to="/dashboard/recurring" />
          <Stat label="Monthly tasks" value={counts.monthly} to="/dashboard/recurring" />
          <Stat label="Notes" value={counts.notes} to="/dashboard/notes" />
        </div>
      </Card>

      <div className="mt-4">
        <Card title="Recently updated" icon={null}>
          {recent.length === 0 ? (
            <EmptyHint>Nothing yet — add your first entry to any section.</EmptyHint>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {recent.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key} className="py-2.5 first:pt-0 last:pb-0">
                    <Link to={item.to} className="flex items-center gap-3 hover:text-primary">
                      <Icon className="h-4 w-4 text-neutral-400 flex-shrink-0" aria-hidden />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium leading-tight truncate">
                          {item.title}
                        </span>
                        <span className="block text-xs text-neutral-500 mt-0.5">
                          {item.type} · {timeAgo(item.updatedAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }> | null;
  cta?: { label: string; to: string };
  flat?: boolean;
  children: React.ReactNode;
}

function Card({ title, icon: Icon, cta, flat, children }: CardProps) {
  return (
    <div className={cn('rounded-md border border-neutral-200 bg-white p-4', flat && 'p-4')}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden />}
          {title}
        </h3>
        {cta && (
          <Link to={cta.to} className="text-xs font-medium text-primary hover:underline">
            {cta.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-md border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-primary/40 p-3 transition-colors"
    >
      <p className="text-2xl font-semibold tracking-tight text-neutral-900 leading-none">
        {value}
      </p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </Link>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-500 italic">{children}</p>;
}

function EmptyOverview() {
  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-white p-12 text-center">
      <h2 className="text-lg font-medium text-neutral-900 mb-1">Your Rolebook is empty.</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Pick any section tab above to add your first entry.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - t) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
