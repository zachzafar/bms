"use client"
import { authClient, client } from '@/lib/api/publicClient'
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPassword() {
    const { mutate, isPending } = client.auth.sendPasswordResetEmail.useMutation()

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
        <Card className="w-full max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
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
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Sending Reset Link...' : 'Send Reset Link'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

