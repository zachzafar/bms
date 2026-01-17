'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { client } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSession, Session } from '@/lib/api/session';
import { StorageService } from '@/lib/api/storage';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { mutate, isPending } = client.auth.login.useMutation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { handleSubmit } = form;

  const onSubmit = async (data: LoginFormData) => {
    mutate(
      {
        body: {
          email: data.email,
          password: data.password,
        },
      },
      {
        onSuccess: async (response) => {
          if (response.status !== 200) throw new Error('Invalid response');

          // Store tokens and user data
          StorageService.setToken(response.body.token);
          StorageService.setUser(response.body.user);
          StorageService.setTenant(response.body.tenants[0]);
          StorageService.setTenantList(response.body.tenants);

          // Create session
          const session: Session = {
            accessToken: response.body.token,
            refreshToken: response.body.refreshToken,
          };

          await createSession(session);
          toast.success('Logged in successfully');

          // 🔐 Role-based redirect (AFTER auth is established)
          if (response.body.user.userType === 'admin') {
            router.replace('/dashboard');
            return;
          }

          router.replace('/');
        },
        onError: (error: any) => {
          console.error('Login error:', error);
          toast.error(
            `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to BookOS</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access your applications
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" placeholder="Enter your email" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <Input type="password" placeholder="Enter your password" {...field} />
                    <FormMessage />
                    <div className="text-sm text-right">
                      <Link
                        href="/forgot-password"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending} size="lg">
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Create one here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
