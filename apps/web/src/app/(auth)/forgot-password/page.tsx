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

export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPassword() {
    const { mutate, isPending } = authClient.auth.sendPasswordResetEmail.useMutation()

    const form = useForm<ForgotPasswordSchemaType>({
      resolver: zodResolver(ForgotPasswordSchema),
      defaultValues: {
        email: ''
      }
    });

    const onSubmit = async (data: ForgotPasswordSchemaType) => {
        mutate({
            body: {email: data.email}
        },{
            onSuccess: () => {
                toast.success('Check your email for a password reset link')
                form.reset()
            },
            onError: (error: any) => {
                toast.error('Failed to send reset email. Please try again.')
            }
        })  
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">B</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                    <p className="text-muted-foreground">
                        Enter your email to receive a password reset link
                    </p>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <Button type="submit" className="w-full" disabled={isPending} size="lg">
                                {isPending ? 'Sending Reset Link...' : 'Send Reset Link'}
                            </Button>
                        </form>
                    </Form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Remember your password?{' '}
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
