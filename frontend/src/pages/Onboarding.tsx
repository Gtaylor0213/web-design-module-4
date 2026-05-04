import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useCreateRolebook, useRolebook } from '@/hooks/useRolebook';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError } from '@/lib/api';

const schema = z.object({
  role_title: z.string().trim().min(1, 'Please enter a role title'),
});

type FormValues = z.infer<typeof schema>;

export function Onboarding() {
  usePageTitle('Get started · Rolebook');
  const navigate = useNavigate();
  const rolebook = useRolebook();
  const createRolebook = useCreateRolebook();

  // If the user already has a rolebook, send them to the dashboard.
  useEffect(() => {
    if (rolebook.data) {
      navigate('/dashboard', { replace: true });
    }
  }, [rolebook.data, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role_title: '' },
  });

  function onSubmit(values: FormValues) {
    createRolebook.mutate(values, {
      onSuccess: () => {
        toast.success('Rolebook created');
        navigate('/dashboard', { replace: true });
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      },
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
      <Logo className="text-xl mb-6" />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h1 className="leading-none font-semibold">What's your role?</h1>
          <CardDescription>
            Give your Rolebook a title that names the role you're keeping notes for. It can be
            specific (&quot;Graduate Assistant – E-Commerce Design Lab&quot;) or broad
            (&quot;Project Manager&quot;).
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="role_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role title</FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder="e.g., Graduate Assistant – Design Lab"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>You can change this later in settings.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end mt-2">
              <Button type="submit" disabled={createRolebook.isPending}>
                {createRolebook.isPending ? 'Creating…' : 'Create my Rolebook'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
