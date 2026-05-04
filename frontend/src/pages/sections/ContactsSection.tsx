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
import type { Contact } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  role: z.string().trim().default(''),
  relationship_notes: z.string().trim().default(''),
  communication_preferences: z.string().trim().default(''),
  watch_out_for: z.string().trim().default(''),
});
type FormValues = z.infer<typeof schema>;

const RESOURCE = 'contacts';

export function ContactsSection() {
  const list = useEntities<Contact>(RESOURCE);
  const create = useCreateEntity<Contact, FormValues>(RESOURCE);
  const update = useUpdateEntity<Contact, FormValues>(RESOURCE);
  const remove = useDeleteEntity(RESOURCE);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [query, setQuery] = useState('');

  const filtered = list.data
    ? searchFilter(list.data, query, [
        (c) => c.name,
        (c) => c.role,
        (c) => c.relationship_notes,
        (c) => c.communication_preferences,
        (c) => c.watch_out_for,
      ])
    : [];

  return (
    <SectionShell
      title="Contacts"
      description="People you work with — colleagues, advisors, vendors, anyone you might need to reach out to. Capture how to talk to them and what to keep in mind."
      count={list.data?.length}
      onAdd={() => setAdding(true)}
      addLabel="Add contact"
    >
      {list.isLoading && <SectionLoading />}
      {list.isError && <SectionError message={list.error.message} />}
      {list.data && list.data.length === 0 && (
        <SectionEmpty
          title="No contacts yet"
          cta="Add contact"
          onAdd={() => setAdding(true)}
        />
      )}
      {list.data && list.data.length > 0 && (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search contacts" />
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">
              No contacts match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <EntryCard
                  key={c.id}
                  title={c.name}
                  meta={c.role || undefined}
                  fields={[
                    { label: 'Communication', value: c.communication_preferences },
                    { label: 'Notes', value: c.relationship_notes },
                    { label: 'Watch out for', value: c.watch_out_for },
                  ]}
                  onEdit={() => setEditing(c)}
                  onDelete={() => setDeleting(c)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ContactDialog
        open={adding}
        onOpenChange={(o) => !o && setAdding(false)}
        title="Add contact"
        defaultValues={blank}
        submitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              setAdding(false);
              toast.success('Contact added');
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
      <ContactDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit contact"
        defaultValues={editing ? toFormValues(editing) : blank}
        submitting={update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          update.mutate(
            { id: editing.id, body: values },
            {
              onSuccess: () => {
                setEditing(null);
                toast.success('Contact updated');
              },
              onError: (e) => toast.error(e.message),
            },
          );
        }}
      />
      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'contact'}?`}
        description="This contact will be permanently removed from your Rolebook."
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success('Contact deleted');
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
  role: '',
  relationship_notes: '',
  communication_preferences: '',
  watch_out_for: '',
};

function toFormValues(c: Contact): FormValues {
  return {
    name: c.name,
    role: c.role,
    relationship_notes: c.relationship_notes,
    communication_preferences: c.communication_preferences,
    watch_out_for: c.watch_out_for,
  };
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues: FormValues;
  submitting: boolean;
  onSubmit: (values: FormValues) => void;
}

function ContactDialog({
  open,
  onOpenChange,
  title,
  defaultValues,
  submitting,
  onSubmit,
}: ContactDialogProps) {
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
          <DialogDescription>People you work with.</DialogDescription>
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
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Faculty Advisor, Lab Manager…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="communication_preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication preferences</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Prefers email; responds within a day"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relationship_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="How you work with this person"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="watch_out_for"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Watch out for</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Pet peeves, pitfalls, things to keep in mind"
                      {...field}
                    />
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
