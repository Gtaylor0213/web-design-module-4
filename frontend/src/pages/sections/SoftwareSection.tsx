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
  FormDescription,
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
import type { Software } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  purpose: z.string().trim().default(''),
  credentials_location: z.string().trim().default(''),
  notes: z.string().trim().default(''),
});
type FormValues = z.infer<typeof schema>;

const RESOURCE = 'software';

export function SoftwareSection() {
  const list = useEntities<Software>(RESOURCE);
  const create = useCreateEntity<Software, FormValues>(RESOURCE);
  const update = useUpdateEntity<Software, FormValues>(RESOURCE);
  const remove = useDeleteEntity(RESOURCE);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Software | null>(null);
  const [deleting, setDeleting] = useState<Software | null>(null);
  const [query, setQuery] = useState('');

  const filtered = list.data
    ? searchFilter(list.data, query, [
        (s) => s.name,
        (s) => s.purpose,
        (s) => s.credentials_location,
        (s) => s.notes,
      ])
    : [];

  return (
    <SectionShell
      title="Software & systems"
      count={list.data?.length}
      onAdd={() => setAdding(true)}
      addLabel="Add software"
    >
      {list.isLoading && <SectionLoading />}
      {list.isError && <SectionError message={list.error.message} />}
      {list.data && list.data.length === 0 && (
        <SectionEmpty title="No software yet" cta="Add software" onAdd={() => setAdding(true)} />
      )}
      {list.data && list.data.length > 0 && (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search software" />
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">
              No software matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <EntryCard
                  key={s.id}
                  title={s.name}
                  meta={s.purpose || undefined}
                  fields={[
                    { label: 'Credentials', value: s.credentials_location },
                    { label: 'Notes', value: s.notes },
                  ]}
                  onEdit={() => setEditing(s)}
                  onDelete={() => setDeleting(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SoftwareDialog
        open={adding}
        onOpenChange={(o) => !o && setAdding(false)}
        title="Add software"
        defaultValues={blank}
        submitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              setAdding(false);
              toast.success('Software added');
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
      <SoftwareDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit software"
        defaultValues={editing ? toFormValues(editing) : blank}
        submitting={update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          update.mutate(
            { id: editing.id, body: values },
            {
              onSuccess: () => {
                setEditing(null);
                toast.success('Software updated');
              },
              onError: (e) => toast.error(e.message),
            },
          );
        }}
      />
      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'software'}?`}
        description="This entry will be permanently removed from your Rolebook."
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success('Software deleted');
            },
            onError: (e) => toast.error(e.message),
          });
        }}
      />
    </SectionShell>
  );
}

const blank: FormValues = {
  name: '',
  purpose: '',
  credentials_location: '',
  notes: '',
};

function toFormValues(s: Software): FormValues {
  return {
    name: s.name,
    purpose: s.purpose,
    credentials_location: s.credentials_location,
    notes: s.notes,
  };
}

interface SoftwareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues: FormValues;
  submitting: boolean;
  onSubmit: (values: FormValues) => void;
}

function SoftwareDialog({
  open,
  onOpenChange,
  title,
  defaultValues,
  submitting,
  onSubmit,
}: SoftwareDialogProps) {
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
          <DialogDescription>Tools and accounts used in the role.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder="WordPress Admin, Slack…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input placeholder="What it's used for" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentials_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Where credentials live</FormLabel>
                  <FormControl>
                    <Input placeholder="1Password under 'GA – WordPress'" {...field} />
                  </FormControl>
                  <FormDescription>
                    Save a pointer here, never the credential itself.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Quirks, gotchas, tips" {...field} />
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
