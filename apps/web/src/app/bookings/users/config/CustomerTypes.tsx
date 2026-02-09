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

const CustomerTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type CustomerTypeFormData = z.infer<typeof CustomerTypeSchema>;

export default function CustomerTypes() {
  const [editingCustomerTypeId, setEditingCustomerTypeId] = useState<number>();
  const queryClient = authClient.useQueryClient();

  const { data: customerTypes, isLoading } = authClient.users.getCustomerTypes.useQuery({
    queryKey: ['customerTypes'],
    queryData: {
      query: {}
    }
  });

  const { mutate: createCustomerTypeMutation } = authClient.users.createCustomerType.useMutation({
    onSuccess: () => {
      toast.success('Customer type created successfully');
      queryClient.invalidateQueries({ queryKey: ['customerTypes'] });
      reset();
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: updateCustomerTypeMutation } = authClient.users.updateCustomerType.useMutation({
    onSuccess: () => {
      toast.success('Customer type updated successfully');
      setEditingCustomerTypeId(undefined);
      queryClient.invalidateQueries({ queryKey: ['customerTypes'] });
      reset();
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: deleteCustomerTypeMutation } = authClient.users.deleteCustomerType.useMutation({
    onSuccess: () => {
      toast.success('Customer type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customerTypes'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const form = useForm<CustomerTypeFormData>({
    resolver: zodResolver(CustomerTypeSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (editingCustomerTypeId && customerTypes?.status === 200) {
      const customerType = customerTypes.body.data.find(ct => ct.id === editingCustomerTypeId);
      if (customerType) {
        reset({
          name: customerType.name,
          description: customerType.description ?? '',
        });
      }
    }
  }, [editingCustomerTypeId, customerTypes, reset]);

  const processForm = (data: CustomerTypeFormData) => {
    if (editingCustomerTypeId) {
      updateCustomerTypeMutation({
        params: { id: editingCustomerTypeId },
        body: data
      });
    } else {
      createCustomerTypeMutation({
        body: data
      });
    }
  };

  const handleDeleteCustomerType = (id: number) => {
    deleteCustomerTypeMutation({ params: { id } });
  };

  const cancelEdit = () => {
    setEditingCustomerTypeId(undefined);
    reset();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>{editingCustomerTypeId ? 'Edit Customer Type' : 'Add New Customer Type'}</CardTitle>
          <CardDescription>
            {editingCustomerTypeId ? 'Update the selected customer type.' : 'Define new types of customers for your organization.'}
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
                      <Input id="customer-type-name" placeholder="Enter customer type name" {...field} />
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
                        id="customer-type-description"
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
                  {editingCustomerTypeId ? 'Update Customer Type' : 'Add Customer Type'}
                </Button>
                {editingCustomerTypeId && (
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
          <CardTitle>Existing Customer Types</CardTitle>
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
              {customerTypes?.status === 200 && customerTypes.body.data.length > 0 ? (
                customerTypes.body.data.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCustomerTypeId(type.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCustomerType(type.id)}
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
                    No Customer Types Found
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
