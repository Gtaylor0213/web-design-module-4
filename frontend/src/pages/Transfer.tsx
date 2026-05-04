import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTransferRolebook } from '@/hooks/useRolebook';
import { ApiError, clearToken } from '@/lib/api';

const schema = z.object({
  new_owner_email: z.string().trim().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export function Transfer() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const transfer = useTransferRolebook();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_owner_email: '' },
  });

  function onSubmit(values: FormValues) {
    setPendingEmail(values.new_owner_email);
    setConfirmOpen(true);
  }

  function executeTransfer() {
    if (!pendingEmail) return;
    transfer.mutate(
      { new_owner_email: pendingEmail },
      {
        onSuccess: (res) => {
          // Burn local state — caller no longer has access. Frontend logs them
          // out and sends them home. Their session token is technically still
          // valid on the backend until it expires, but every protected
          // endpoint will now 404 not_setup or scope correctly.
          clearToken();
          qc.clear();
          toast.success(res.message);
          navigate('/', { replace: true });
        },
        onError: (err) => {
          setConfirmOpen(false);
          if (err instanceof ApiError && err.code === 'no_account') {
            form.setError('new_owner_email', { message: err.message });
          } else if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error('Transfer failed');
          }
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
          <Link to="/settings">
            <ArrowLeft className="h-4 w-4" />
            Back to settings
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Transfer your Rolebook</CardTitle>
            <CardDescription>
              Hand your Rolebook off to another registered user.
            </CardDescription>
          </CardHeader>

          <div className="mx-6 mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <p className="font-medium mb-1">This is permanent.</p>
              <p>
                After the transfer succeeds, the new owner will have full edit access to every
                section of your Rolebook — and you will no longer be able to see or edit any
                of it. Your account will remain, but it will have no Rolebook attached.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
                <FormField
                  control={form.control}
                  name="new_owner_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New owner's email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="successor@example.com"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end mt-2">
                <Button type="submit" variant="destructive" disabled={transfer.isPending}>
                  Continue to confirm
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will transfer your Rolebook to <strong>{pendingEmail}</strong> immediately.
              You will lose all access. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={transfer.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeTransfer}
              disabled={transfer.isPending}
            >
              {transfer.isPending ? 'Transferring…' : 'Yes, transfer it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
