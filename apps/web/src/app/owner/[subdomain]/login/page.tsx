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
import { useParams, useRouter } from 'next/navigation';
import { createSession, Session } from '@/lib/api/session';
import { StorageService } from '@/lib/api/storage';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function OwnerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const { mutate, isPending } = client.auth.login.useMutation();

  // Fetch tenant branding data
  const { data: assetsResponse, isLoading: loadingTenant } = client.assets.getAssetsBySubdomain.useQuery({
    queryKey: ['tenant-branding', subdomain],
    queryData: {
      params: { subdomain },
      query: { page: 1, pageSize: 1 },
    },
  });

  // Extract tenant name from assets response (if available)
  const tenantName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);

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

          // Verify user is an owner
          if (response.body.user.userType !== 'owner') {
            toast.error('Access denied. Owner credentials required.');
            return;
          }

          // Store tokens and user data
          StorageService.setToken(response.body.token);
          StorageService.setUser(response.body.user);

          // Find the tenant matching the subdomain
          const matchingTenant = response.body.tenants.find(
            (tenant: any) => tenant.subdomain === subdomain
          );

          if (!matchingTenant) {
            toast.error('You do not have access to this tenant.');
            return;
          }

          StorageService.setTenant(matchingTenant);
          StorageService.setTenantList(response.body.tenants);

          // Create session
          const session: Session = {
            accessToken: response.body.token,
            refreshToken: response.body.refreshToken,
          };

          await createSession(session);
          toast.success('Logged in successfully');

          // Get owner ID to redirect to dashboard
          // The owner ID will be fetched from the API or can be derived from user
          router.replace(`/owner/${subdomain}/dashboard`);
        },
        onError: (error: any) => {
          console.error('Login error:', error);
          toast.error(
            `Login failed: ${error instanceof Error ? error.message : 'Invalid credentials'}`
          );
        },
      }
    );
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">
              {tenantName.charAt(0)}
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">{tenantName} Owner Portal</CardTitle>
          <p className="text-muted-foreground">
            Sign in to manage your properties
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
              Need help accessing your account?{' '}
              <a
                href={`mailto:support@${subdomain}.com`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
