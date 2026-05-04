import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { EntryCard } from '@/components/EntryCard';
import { SearchInput } from '@/components/SearchInput';
import { SubtaskEditor } from '@/components/SubtaskEditor';
import { ProjectCardSubtasks } from '@/components/ProjectCardSubtasks';
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
  SectionShell,
} from '@/components/SectionShell';
import { DeleteDialog } from '@/components/DeleteDialog';
import {
  useCreateEntity,
  useDeleteEntity,
  useEntities,
  useUpdateEntity,
} from '@/lib/crud';
import { searchFilter } from '@/lib/filter';
import type { Project, ProjectStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'done', label: 'Done' },
];

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  status: z.enum(['active', 'on_hold', 'done']),
  deadline: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use YYYY-MM-DD or leave blank')
    .default(''),
  notes: z.string().trim().default(''),
});
type FormValues = z.infer<typeof schema>;

const RESOURCE = 'projects';

export function ProjectsSection() {
  const list = useEntities<Project>(RESOURCE);
  const create = useCreateEntity<Project, FormValues>(RESOURCE);
  const update = useUpdateEntity<Project, FormValues>(RESOURCE);
  const remove = useDeleteEntity(RESOURCE);

  const [adding, setAdding] = useState(false);
  // Track the editing project by id rather than holding a snapshot of the
  // object. Deriving from the live list means subtask add / delete /
  // toggle (which invalidate the projects query) propagate immediately
  // into the open dialog.
  const [editingId, setEditingId] = useState<number | null>(null);
  const editing =
    editingId != null ? list.data?.find((p) => p.id === editingId) ?? null : null;
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [query, setQuery] = useState('');

  const filtered = list.data
    ? searchFilter(list.data, query, [
        (p) => p.title,
        (p) => statusLabel(p.status),
        (p) => p.deadline,
        (p) => p.notes,
      ])
    : [];

  return (
    <SectionShell
      title="Projects"
      description="Bounded work with a clear scope and a status (active, on hold, done). Add a deadline if there is one."
      count={list.data?.length}
      onAdd={() => setAdding(true)}
      addLabel="Add project"
    >
      {list.isLoading && <SectionLoading />}
      {list.isError && <SectionError message={list.error.message} />}
      {list.data && list.data.length === 0 && (
        <SectionEmpty title="No projects yet" cta="Add project" onAdd={() => setAdding(true)} />
      )}
      {list.data && list.data.length > 0 && (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search projects" />
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">
              No projects match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <EntryCard
                  key={p.id}
                  title={p.title}
                  meta={projectMeta(p)}
                  badge={{
                    label: statusLabel(p.status),
                    tone: statusTone(p.status),
                  }}
                  fields={[{ label: 'Notes', value: p.notes }]}
                  bottomContent={<ProjectCardSubtasks project={p} />}
                  onEdit={() => setEditingId(p.id)}
                  onDelete={() => setDeleting(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ProjectDialog
        open={adding}
        onOpenChange={(o) => !o && setAdding(false)}
        title="Add project"
        defaultValues={blank}
        submitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              setAdding(false);
              toast.success('Project added');
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
      <ProjectDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditingId(null)}
        title="Edit project"
        defaultValues={editing ? toFormValues(editing) : blank}
        submitting={update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          update.mutate(
            { id: editing.id, body: values },
            {
              onSuccess: () => {
                setEditingId(null);
                toast.success('Project updated');
              },
              onError: (e) => toast.error(e.message),
            },
          );
        }}
        editingProject={editing}
      />
      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.title ?? 'project'}?`}
        description="This project will be permanently removed from your Rolebook."
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success('Project deleted');
            },
            onError: (e) => toast.error(e.message),
          });
        }}
      />
    </SectionShell>
  );
}

const blank: FormValues = {
  title: '',
  status: 'active',
  deadline: '',
  notes: '',
};

function toFormValues(p: Project): FormValues {
  return {
    title: p.title,
    status: p.status,
    deadline: p.deadline,
    notes: p.notes,
  };
}

function statusLabel(s: ProjectStatus): string {
  switch (s) {
    case 'active':
      return 'Active';
    case 'on_hold':
      return 'On hold';
    case 'done':
      return 'Done';
  }
}
function statusTone(s: ProjectStatus): 'green' | 'amber' | 'neutral' {
  switch (s) {
    case 'active':
      return 'green';
    case 'on_hold':
      return 'amber';
    case 'done':
      return 'neutral';
  }
}

function formatDate(iso: string): string {
  // iso looks like "2026-12-15"; try to render as Dec 15, 2026
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Card meta line: deadline + subtask progress, separated by " · ". */
function projectMeta(p: Project): string | undefined {
  const parts: string[] = [];
  if (p.deadline) parts.push(`Due ${formatDate(p.deadline)}`);
  if (p.subtasks && p.subtasks.length > 0) {
    const done = p.subtasks.filter((s) => s.completed).length;
    parts.push(`${done} / ${p.subtasks.length} done`);
  }
  return parts.length ? parts.join(' · ') : undefined;
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues: FormValues;
  submitting: boolean;
  onSubmit: (values: FormValues) => void;
  /** When editing an existing project, pass it so the subtask editor can
   *  show inside the dialog. The Add dialog skips it since there's no
   *  project_id to attach subtasks to yet. */
  editingProject?: Project | null;
}

function ProjectDialog({
  open,
  onOpenChange,
  title,
  defaultValues,
  submitting,
  onSubmit,
  editingProject,
}: ProjectDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Bounded work with a status and optional deadline.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Status, blockers, context" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {editingProject && (
              <SubtaskEditor
                projectId={editingProject.id}
                subtasks={editingProject.subtasks ?? []}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
