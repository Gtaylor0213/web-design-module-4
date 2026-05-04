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
import type { Cadence, RecurringTask } from '@/lib/types';

const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'semester', label: 'Semester' },
  { value: 'ad_hoc', label: 'Ad-hoc' },
];

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  cadence: z.enum(['weekly', 'monthly', 'semester', 'ad_hoc']),
  notes: z.string().trim().default(''),
});
type FormValues = z.infer<typeof schema>;

const RESOURCE = 'recurring-tasks';

export function RecurringSection() {
  const list = useEntities<RecurringTask>(RESOURCE);
  const create = useCreateEntity<RecurringTask, FormValues>(RESOURCE);
  const update = useUpdateEntity<RecurringTask, FormValues>(RESOURCE);
  const remove = useDeleteEntity(RESOURCE);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RecurringTask | null>(null);
  const [deleting, setDeleting] = useState<RecurringTask | null>(null);

  return (
    <SectionShell
      title="Recurring tasks"
      count={list.data?.length}
      onAdd={() => setAdding(true)}
      addLabel="Add recurring task"
    >
      {list.isLoading && <SectionLoading />}
      {list.isError && <SectionError message={list.error.message} />}
      {list.data && list.data.length === 0 && (
        <SectionEmpty
          title="No recurring tasks yet"
          cta="Add recurring task"
          onAdd={() => setAdding(true)}
        />
      )}
      {list.data && list.data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.data.map((t) => (
            <EntryCard
              key={t.id}
              title={t.name}
              badge={{ label: cadenceLabel(t.cadence), tone: 'blue' }}
              fields={[{ label: 'Notes', value: t.notes }]}
              onEdit={() => setEditing(t)}
              onDelete={() => setDeleting(t)}
            />
          ))}
        </div>
      )}

      <RecurringDialog
        open={adding}
        onOpenChange={(o) => !o && setAdding(false)}
        title="Add recurring task"
        defaultValues={blank}
        submitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              setAdding(false);
              toast.success('Recurring task added');
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
      <RecurringDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit recurring task"
        defaultValues={editing ? toFormValues(editing) : blank}
        submitting={update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          update.mutate(
            { id: editing.id, body: values },
            {
              onSuccess: () => {
                setEditing(null);
                toast.success('Recurring task updated');
              },
              onError: (e) => toast.error(e.message),
            },
          );
        }}
      />
      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'recurring task'}?`}
        description="This task will be permanently removed from your Rolebook."
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success('Recurring task deleted');
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
  cadence: 'weekly',
  notes: '',
};

function toFormValues(t: RecurringTask): FormValues {
  return { name: t.name, cadence: t.cadence, notes: t.notes };
}

function cadenceLabel(c: Cadence): string {
  switch (c) {
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'semester':
      return 'Semester';
    case 'ad_hoc':
      return 'Ad-hoc';
  }
}

interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues: FormValues;
  submitting: boolean;
  onSubmit: (values: FormValues) => void;
}

function RecurringDialog({
  open,
  onOpenChange,
  title,
  defaultValues,
  submitting,
  onSubmit,
}: RecurringDialogProps) {
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
          <DialogDescription>Ongoing obligations with a cadence.</DialogDescription>
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
              name="cadence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cadence</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CADENCE_OPTIONS.map((o) => (
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Where files live, who to loop in"
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
