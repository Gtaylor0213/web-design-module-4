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

import { EntryCard } from '@/components/EntryCard';
import { SearchInput } from '@/components/SearchInput';
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
import type { Note } from '@/lib/types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  body: z.string().trim().min(1, 'Body is required'),
});
type FormValues = z.infer<typeof schema>;

const RESOURCE = 'notes';

export function NotesSection() {
  const list = useEntities<Note>(RESOURCE);
  const create = useCreateEntity<Note, FormValues>(RESOURCE);
  const update = useUpdateEntity<Note, FormValues>(RESOURCE);
  const remove = useDeleteEntity(RESOURCE);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [query, setQuery] = useState('');

  const filtered = list.data
    ? searchFilter(list.data, query, [(n) => n.title, (n) => n.body])
    : [];

  return (
    <SectionShell
      title="Notes"
      description="Freeform knowledge entries — tribal know-how, learned tricks, anything that doesn't fit one of the other sections."
      count={list.data?.length}
      onAdd={() => setAdding(true)}
      addLabel="Add note"
    >
      {list.isLoading && <SectionLoading />}
      {list.isError && <SectionError message={list.error.message} />}
      {list.data && list.data.length === 0 && (
        <SectionEmpty title="No notes yet" cta="Add note" onAdd={() => setAdding(true)} />
      )}
      {list.data && list.data.length > 0 && (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search notes" />
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">
              No notes match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((n) => (
                <EntryCard
                  key={n.id}
                  title={n.title}
                  fields={[{ label: 'Body', value: n.body }]}
                  onEdit={() => setEditing(n)}
                  onDelete={() => setDeleting(n)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <NoteDialog
        open={adding}
        onOpenChange={(o) => !o && setAdding(false)}
        title="Add note"
        defaultValues={blank}
        submitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              setAdding(false);
              toast.success('Note added');
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
      <NoteDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit note"
        defaultValues={editing ? toFormValues(editing) : blank}
        submitting={update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          update.mutate(
            { id: editing.id, body: values },
            {
              onSuccess: () => {
                setEditing(null);
                toast.success('Note updated');
              },
              onError: (e) => toast.error(e.message),
            },
          );
        }}
      />
      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.title ?? 'note'}?`}
        description="This note will be permanently removed from your Rolebook."
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success('Note deleted');
            },
            onError: (e) => toast.error(e.message),
          });
        }}
      />
    </SectionShell>
  );
}

const blank: FormValues = { title: '', body: '' };

function toFormValues(n: Note): FormValues {
  return { title: n.title, body: n.body };
}

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues: FormValues;
  submitting: boolean;
  onSubmit: (values: FormValues) => void;
}

function NoteDialog({
  open,
  onOpenChange,
  title,
  defaultValues,
  submitting,
  onSubmit,
}: NoteDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Freeform knowledge entries.</DialogDescription>
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
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea rows={10} placeholder="Write whatever needs remembering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
