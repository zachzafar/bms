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

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  organization: z.string().min(1, 'Organization is required'),
});

 type UserRegistration = z.infer<typeof signupSchema>;


export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { mutate, isPending } = client.auth.registerTenant.useMutation();

  const form = useForm<UserRegistration>({
    resolver: zodResolver(signupSchema),
  });

  const { handleSubmit, reset } = form;

  const onSubmit = async (data: UserRegistration) => {

    try {
      await mutate({
        body: {
          tenant: {
            name: data.organization,
            subdomain: data.organization,
          },
          adminUser: {
            name: data.name,
            email: data.email,
            password: data.password
          }
        }
      }, {
        onSuccess: (response) => {
          if (response.status === 201) {
            toast({ description: 'Account created successfully' });
            reset();
            router.push('/login');
          } else {
            toast({ 
              description: 'Account creation failed', 
              variant: 'destructive' 
            });
          }
        },
        onError: (error) => {
          toast({
            description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      });
    } catch (error) {
      // This catch block is mainly for unexpected errors
      toast({
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <Input {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <Input {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

