import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { useLogout, useMe } from '@/hooks/useAuth';
import { useRolebook, useUpdateRolebook } from '@/hooks/useRolebook';
import { usePageTitle } from '@/hooks/usePageTitle';

const schema = z.object({
  role_title: z.string().trim().min(1, 'Role title is required'),
});
type FormValues = z.infer<typeof schema>;

export function Settings() {
  usePageTitle('Settings · Rolebook');
  const me = useMe();
  const rolebook = useRolebook();
  const update = useUpdateRolebook();
  const logout = useLogout();
  const [editing, setEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role_title: rolebook.data?.role_title ?? '' },
    values: { role_title: rolebook.data?.role_title ?? '' },
  });

  function onSave(values: FormValues) {
    update.mutate(values, {
      onSuccess: () => {
        setEditing(false);
        toast.success('Role title updated');
      },
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Role title */}
          <Card>
            <CardHeader>
              <CardTitle>Role title</CardTitle>
              <CardDescription>The headline of your Rolebook.</CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSave)}
                    className="space-y-3"
                  >
                    <FormField
                      control={form.control}
                      name="role_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Role title</FormLabel>
                          <FormControl>
                            <Input autoFocus {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          form.reset({
                            role_title: rolebook.data?.role_title ?? '',
                          });
                        }}
                        disabled={update.isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={update.isPending}>
                        {update.isPending ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-neutral-900 font-medium break-words">
                    {rolebook.data?.role_title ?? '—'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account info */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your sign-in details.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <dl className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-4">
                <dt className="text-neutral-500">Name</dt>
                <dd className="text-neutral-900">{me.data?.name ?? '—'}</dd>
                <dt className="text-neutral-500">Email</dt>
                <dd className="text-neutral-900">{me.data?.email ?? '—'}</dd>
              </dl>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  {logout.isPending ? 'Logging out…' : 'Log out'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle>Export to PDF</CardTitle>
              <CardDescription>
                Download a clean printout of your full Rolebook — every section, every entry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportPdfButton variant="default" size="default" showLabel />
            </CardContent>
          </Card>

          {/* Transfer */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer ownership</CardTitle>
              <CardDescription>
                Hand your Rolebook off to another person. After transfer, you no longer have
                access to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/settings/transfer">
                  Transfer my Rolebook
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
