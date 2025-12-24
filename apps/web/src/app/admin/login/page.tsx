"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { createSession } from '@/lib/api/session';
import { StorageService } from '@/lib/api/storage';
import { Session } from '@/lib/api/session';

const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginSchemaType = z.infer<typeof AdminLoginSchema>;

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<AdminLoginSchemaType>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate: loginAdmin, isPending } = authClient.auth.login.useMutation();

  const onSubmit = async (data: AdminLoginSchemaType) => {
    // Check domain restriction first
    if (!data.email.endsWith('@tradewindstudio.dev')) {
      toast.error('Only @tradewindstudio.dev emails are allowed for admin access');
      return;
    }

    loginAdmin({
      body: {
        email: data.email,
        password: data.password
      }
    }, {
      onSuccess: async (response) => {
        if (response.status !== 200) throw new Error('Invalid response');
        
        // Store tokens and user data
        StorageService.setToken(response.body.token);
        StorageService.setUser(response.body.user);
     

        // Create session
        const session: Session = {
          refreshToken: response.body.refreshToken,
          accessToken: response.body.token
        };

        await createSession(session);
        toast.success('Logged in successfully');
        
        // Redirect to apps page instead of dashboard
        router.push('/dashboard');
      },
      onError: (error) => {
        console.error('Admin login error:', error);
        toast.error('Login failed. Please check your credentials.');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800 text-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">System Admin</CardTitle>
          <p className="text-slate-300">
            Sign in to access the admin dashboard
          </p>
          <div className="mt-2 p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
            <p className="text-sm text-purple-300">
              <strong>Restricted Access:</strong> Only authorized administrators can access this system
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Email</FormLabel>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Password</FormLabel>
                    <div className="relative">
                      <Input 
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                disabled={isPending}
                size="lg"
              >
                {isPending ? 'Signing in...' : 'Sign In as Admin'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400"><a href='/admin-registration'>
              Need help? Contact your system administrator</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
