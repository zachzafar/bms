'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authClient } from '@/lib/api/publicClient';
import { z } from 'zod';

const PaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type PaymentMethodFormData = z.infer<typeof PaymentMethodSchema>;

export default function PaymentMethods() {
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<number>();
  const queryClient = authClient.useQueryClient();

  const { data: paymentMethods, isLoading } = authClient.billing.getPaymentMethods.useQuery({
    queryKey: ['paymentMethods'],
    queryData: {
      query: {}
    }
  });

  const { mutate: createPaymentMethodMutation } = authClient.billing.createPaymentMethod.useMutation({
    onSuccess: () => {
      toast.success('Payment method created successfully');
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      reset();
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: updatePaymentMethodMutation } = authClient.billing.updatePaymentMethod.useMutation({
    onSuccess: () => {
      toast.success('Payment method updated successfully');
      setEditingPaymentMethodId(undefined);
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      reset();
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: deletePaymentMethodMutation } = authClient.billing.deletePaymentMethod.useMutation({
    onSuccess: () => {
      toast.success('Payment method deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(PaymentMethodSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (editingPaymentMethodId && paymentMethods?.status === 200) {
      const paymentMethod = paymentMethods.body.data.find(pm => pm.id === editingPaymentMethodId);
      if (paymentMethod) {
        reset({
          name: paymentMethod.name,
          description: paymentMethod.description ?? '',
        });
      }
    }
  }, [editingPaymentMethodId, paymentMethods, reset]);

  const processForm = (data: PaymentMethodFormData) => {
    if (editingPaymentMethodId) {
      updatePaymentMethodMutation({
        params: { id: editingPaymentMethodId },
        body: data
      });
    } else {
      createPaymentMethodMutation({
        body: data
      });
    }
  };

  const handleDeletePaymentMethod = (id: number) => {
    deletePaymentMethodMutation({
      params: { id },
      body: undefined
    });
  };

  const cancelEdit = () => {
    setEditingPaymentMethodId(undefined);
    reset();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>{editingPaymentMethodId ? 'Edit Payment Method' : 'Add New Payment Method'}</CardTitle>
          <CardDescription>
            {editingPaymentMethodId ? 'Update the selected payment method.' : 'Define new payment methods for your organization.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(processForm)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input id="payment-method-name" placeholder="Enter payment method name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        id="payment-method-description"
                        placeholder="Enter a description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingPaymentMethodId ? 'Update Payment Method' : 'Add Payment Method'}
                </Button>
                {editingPaymentMethodId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Existing Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods?.status === 200 && paymentMethods.body.data.length > 0 ? (
                paymentMethods.body.data.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>{method.name}</TableCell>
                    <TableCell>{method.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPaymentMethodId(method.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No Payment Methods Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
