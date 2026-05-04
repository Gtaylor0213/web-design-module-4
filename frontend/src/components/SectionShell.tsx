import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SectionShellProps {
  title: string;
  count?: number;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}

/** Wraps a section's content with the page header (title + count + Add
 *  button) so the five section pages render consistently. */
export function SectionShell({ title, count, onAdd, addLabel, children }: SectionShellProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* h2 because the dashboard's role title is the page-level h1.
           *  Each section is a subsection of that page. */}
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {title}
          </h2>
          {typeof count === 'number' && (
            <p className="text-sm text-neutral-500">
              {count} {count === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {addLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}

export function SectionLoading() {
  return <div className="text-sm text-neutral-500 py-12 text-center">Loading…</div>;
}

export function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

interface SectionEmptyProps {
  title: string;
  cta: string;
  onAdd: () => void;
}

export function SectionEmpty({ title, cta, onAdd }: SectionEmptyProps) {
  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <p className="text-neutral-700 font-medium mb-1">{title}</p>
      <p className="text-sm text-neutral-500 mb-4">Get started by adding your first entry.</p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" />
        {cta}
      </Button>
    </div>
  );
}
