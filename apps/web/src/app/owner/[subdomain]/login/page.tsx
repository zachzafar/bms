'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { client } from '@/lib/api/publicClient';
import { baseUrl } from '@/lib/api/publicClient';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { StorageService } from '@/lib/api/storage';
import { Loader2, MailCheck } from 'lucide-react';
import axios from 'axios';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function OwnerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = params.subdomain as string;

  const [emailSent, setEmailSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Fetch tenant branding + ID
  const { data: tenantResponse, isLoading: loadingTenant } = client.tenants.getTenantBySubdomain.useQuery({
    queryKey: ['tenant-branding', subdomain],
    queryData: { params: { subdomain } },
  });

  const tenant = tenantResponse?.status === 200 ? tenantResponse.body : null;
  const tenantName = tenant?.name || subdomain.charAt(0).toUpperCase() + subdomain.slice(1);

  useEffect(() => {
    if (tenant?.id) setTenantId(tenant.id);
  }, [tenant]);

  // Auto-verify token from URL on mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token || !tenant) return;

    setVerifying(true);
    axios
      .post(`${baseUrl}/owner-auth/verify`, { token })
      .then((res) => {
        const { accessToken, owner } = res.data;
        StorageService.setToken(accessToken);
        StorageService.setOwnerUser(owner);
        // Store minimal tenant so authClient sends x-tenant-id header
        StorageService.setTenant(tenant as any);
        toast.success('Logged in successfully');
        window.location.href = `/owner/${subdomain}/dashboard`;
      })
      .catch(() => {
        toast.error('This login link is invalid or has expired. Please request a new one.');
        setVerifying(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: EmailFormData) => {
    if (!tenantId) {
      toast.error('Tenant not found. Please check the URL.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${baseUrl}/owner-auth/magic-link`, {
        email: data.email,
        tenantId,
      });
      setEmailSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTenant || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            {verifying ? 'Verifying your login link…' : 'Loading…'}
          </p>
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
            {emailSent ? 'Check your email' : 'Enter your email to receive a login link'}
          </p>
        </CardHeader>

        <CardContent>
          {emailSent ? (
            <div className="text-center py-6 space-y-4">
              <MailCheck className="h-14 w-14 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                We sent a login link to <strong>{form.getValues('email')}</strong>. Click it to
                sign in — it expires in 24 hours.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEmailSent(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Button type="submit" className="w-full" disabled={submitting} size="lg">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send login link'
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <a
                href={`mailto:support@${subdomain}.com`}
                className="text-primary hover:underline font-medium"
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
