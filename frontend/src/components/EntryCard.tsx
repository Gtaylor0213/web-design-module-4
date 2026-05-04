import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EntryCardProps {
  title: string;
  badge?: { label: string; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' };
  meta?: string;
  fields: { label: string; value?: string | null }[];
  onEdit: () => void;
  onDelete: () => void;
  /** Optional element rendered before the title in the header row. Used
   *  by ContactsSection for the favorite-star toggle. */
  leadingAction?: React.ReactNode;
}

/** Generic card layout shared by all five section types. Each section
 *  page maps its row-shape to this component's props. */
export function EntryCard({ title, badge, meta, fields, onEdit, onDelete, leadingAction }: EntryCardProps) {
  const visible = fields.filter((f) => f.value && f.value.trim() !== '');
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-start gap-2">
          {leadingAction}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-neutral-900 leading-tight break-words">{title}</h3>
            {meta && <p className="text-xs text-neutral-500 mt-0.5">{meta}</p>}
          </div>
        </div>
        {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
      </div>

      {visible.length > 0 && (
        <dl className="space-y-2 text-sm">
          {visible.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium text-neutral-500">{f.label}</dt>
              <dd className="text-neutral-800 whitespace-pre-wrap break-words">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex justify-end gap-1 -mb-1 mt-auto pt-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue';
  children: React.ReactNode;
}) {
  const tones = {
    neutral: 'bg-neutral-100 text-neutral-700',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
