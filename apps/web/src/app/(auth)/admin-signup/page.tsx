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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Registration</h1>
          <p className="text-slate-300 mt-2">
            Register new system administrators
          </p>
        </div>

        <Card className="border-slate-700 bg-slate-800 text-white">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Register New Admin</CardTitle>
                <p className="text-slate-300 text-sm">
                  Create a new administrator account
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <p className="text-sm text-blue-300">
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
                        <FormLabel className="text-slate-200">Full Name</FormLabel>
                        <Input 
                          type="text" 
                          placeholder="Enter full name"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
                        <FormLabel className="text-slate-200">Email Address</FormLabel>
                        <Input 
                          type="email" 
                          placeholder="admin@tradewindstudio.dev"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700 text-white" 
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          <Card className="border-slate-700 bg-slate-800 text-white">
            <CardContent className="p-6">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Secure Access</h3>
              <p className="text-sm text-slate-300">
                New admins get secure, time-limited password setup links
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800 text-white">
            <CardContent className="p-6">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Domain Restricted</h3>
              <p className="text-sm text-slate-300">
                Only @tradewindstudio.dev emails can be registered as admins
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800 text-white">
            <CardContent className="p-6">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Full Privileges</h3>
              <p className="text-sm text-slate-300">
                New admins get complete system access and management capabilities
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
