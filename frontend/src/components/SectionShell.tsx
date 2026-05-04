import { Info, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SectionShellProps {
  title: string;
  /** One-line "what is this for" description. Renders as a subtle info
   *  card under the title row to orient new users. */
  description?: string;
  count?: number;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}

/** Wraps a section's content with the page header (title + count + Add
 *  button) so the five section pages render consistently. */
export function SectionShell({
  title,
  description,
  count,
  onAdd,
  addLabel,
  children,
}: SectionShellProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
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
      {description && (
        <div className="mb-6 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden />
          <p className="text-sm text-neutral-700 leading-snug">{description}</p>
        </div>
      )}
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
