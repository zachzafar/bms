'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { client } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';
import { createSession, Session } from '@/lib/api/session';
import { StorageService } from '@/lib/api/storage';
import { access } from 'fs';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { mutate, isPending } = client.auth.login.useMutation();
  // const isPending = false
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { handleSubmit } = form;

  const onSubmit = async (data: LoginFormData) => {

      console.log('data', data);
      mutate({
        body: {
          email: data.email,
          password: data.password,
        }
      },{
        onSuccess: async (response) => {
          console.log('response', response);
      if (response.status !== 200) throw new Error('Invalid response');
      
      StorageService.setToken(response.body.token);
      StorageService.setUser(response.body.user)
      StorageService.setTenant(response.body.tenants[0])
      StorageService.setTenantList(response.body.tenants)

      const session: Session = {
      refreshToken: response.body.refreshToken,
      accessToken: response.body.token
      };

      await createSession(session)
      console.log('Newly created session:', session);
      toast({ description: 'Logged in successfully' });
      router.push('/dashboard');
      // Redirect to dashboard
        },
        onError: (error) => {
          console.error('error', error);
          toast({
            description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      });
      
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Log In</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

