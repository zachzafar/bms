"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { authClient } from '@/lib/api/publicClient';

const AdminRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').refine(
    (email) => email.endsWith('@tradewindstudio.dev'),
    'Only @tradewindstudio.dev emails are allowed for admin registration'
  ),
});

type AdminRegistrationSchemaType = z.infer<typeof AdminRegistrationSchema>;

export default function AdminRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<AdminRegistrationSchemaType>({
    resolver: zodResolver(AdminRegistrationSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const { mutate: registerAdmin, isPending } = authClient.auth.registerAdmin.useMutation();

  const onSubmit = async (data: AdminRegistrationSchemaType) => {
    registerAdmin({
      body: data
    }, {
      onSuccess: (response) => {
        if (response.status === 201) {
          toast.success('Admin registration successful! Check your email to set your password.');
          form.reset();
          
          // Redirect back to dashboard after successful registration
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        } else {
          toast.error('Registration failed. Please try again.');
        }
      },
      onError: (error) => {
        console.error('Admin registration error:', error);
        toast.error('Registration failed. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Registration</h1>
          <p className="text-muted-foreground mt-2">
            Register new system administrators
          </p>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Register New Admin</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Create a new administrator account
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-foreground">
                <strong>Important:</strong> Only @tradewindstudio.dev emails are authorized for admin access.
                New admins will receive an email to set their password.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          type="text"
                          placeholder="Enter full name"
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <Input
                          type="email"
                          placeholder="admin@tradewindstudio.dev"
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register Admin
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Access</h3>
              <p className="text-sm text-muted-foreground">
                New admins get secure, time-limited password setup links
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Domain Restricted</h3>
              <p className="text-sm text-muted-foreground">
                Only @tradewindstudio.dev emails can be registered as admins
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Full Privileges</h3>
              <p className="text-sm text-muted-foreground">
                New admins get complete system access and management capabilities
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
