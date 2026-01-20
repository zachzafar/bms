"use client"

import { authClient } from '@/lib/api/publicClient'
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export const SignupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupSchemaType = z.infer<typeof SignupSchema>;

export default function Signup() {
    const { mutate, isPending } = authClient.auth.registerTenant.useMutation()

    const form = useForm<SignupSchemaType>({
      resolver: zodResolver(SignupSchema),
      defaultValues: {
        name: '',
        email: '',
        password: ''
      }
    });

    const onSubmit = async (data: SignupSchemaType) => {
        // For now, this is a placeholder since we need tenant data
        toast.info('Tenant registration coming soon. For now, please use admin registration if you need system access.');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <p className="text-muted-foreground">
                        Sign up for a new BookOS account
                    </p>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <Input type="text" placeholder="Enter your full name" {...field} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
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
                                control={form.control}
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
                                {isPending ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </form>
                    </Form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-primary hover:text-primary/80 font-medium"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
